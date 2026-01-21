import React, { useState, useEffect } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { CrateLogo, LockIcon, UnlockIcon, TrashIcon, CopyIcon, PlusIcon, EyeIcon, EyeOffIcon, SunIcon, MoonIcon, EditIcon } from './components/Icons';
import { Toast } from './components/Toast';
import {
  hasMasterPassword,
  setMasterPassword,
  verifyPassword,
  getNotes,
  saveNotes,
  resetApp,
  getTheme,
  setTheme as persistTheme,
  setSecurityQA,
  getSecurityQuestion,
  verifySecurityAnswer
} from './services/storageService';
import { Note, ViewState, ToastState, Theme } from './types';

const App: React.FC = () => {
  // App State
  const [view, setView] = useState<ViewState>('locked');
  const [notes, setNotes] = useState<Note[]>([]);
  const [theme, setThemeState] = useState<Theme>('dark'); // Default to dark

  // Input State
  const [inputPassword, setInputPassword] = useState('');
  const [inputTitle, setInputTitle] = useState('');
  const [inputContent, setInputContent] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Security Question State
  const [securityQuestion, setSecurityQuestion] = useState('İlk evcil hayvanının adı nedir?');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [resetStepQuestion, setResetStepQuestion] = useState('');
  const [resetStepAnswer, setResetStepAnswer] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');

  // UI State
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'info' });
  const [isNoteInputExpanded, setIsNoteInputExpanded] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  // Initialize App
  useEffect(() => {
    // 1. Load Theme
    const savedTheme = getTheme();
    setThemeState(savedTheme);
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // 2. Check Auth
    const isSetup = hasMasterPassword();
    if (!isSetup) {
      setView('setup');
    } else {
      setView('locked');
    }

    // 3. Setup Auto-Lock on Background
    const setupAppListener = async () => {
      await CapacitorApp.removeAllListeners();
      await CapacitorApp.addListener('appStateChange', ({ isActive }) => {
        if (!isActive) {
          // App went to background
          if (hasMasterPassword()) {
            setView('locked');
          }
        }
      });
    };
    setupAppListener();

    return () => {
      CapacitorApp.removeAllListeners();
    };
  }, []);

  // Persist notes when they change (only if unlocked)
  useEffect(() => {
    if (view === 'dashboard') {
      saveNotes(notes);
    }
  }, [notes, view]);

  // Helpers
  const showToast = (message: string, type: ToastState['type'] = 'success') => {
    setToast({ show: true, message, type });
  };

  const closeToast = () => {
    setToast(prev => ({ ...prev, show: false }));
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setThemeState(newTheme);
    persistTheme(newTheme);
  };

  // Auth Handlers
  const handleSetup = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputPassword.length < 4) {
      showToast('Şifre en az 4 karakter olmalıdır.', 'error');
      return;
    }
    if (securityAnswer.length < 2) {
      showToast('Lütfen geçerli bir güvenlik cevabı girin.', 'error');
      return;
    }

    setMasterPassword(inputPassword);
    setSecurityQA(securityQuestion, securityAnswer);

    setInputPassword('');
    setSecurityAnswer('');
    setNotes([]);
    setView('dashboard');
    showToast('Kasa başarıyla oluşturuldu!');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyPassword(inputPassword)) {
      setNotes(getNotes());
      setInputPassword('');
      setView('dashboard');
      showToast('Hoş geldin!');
    } else {
      showToast('Hatalı şifre, tekrar dene.', 'error');
    }
  };

  const handleForgotPasswordClick = () => {
    const q = getSecurityQuestion();
    if (q) {
      setResetStepQuestion(q);
      setResetStepAnswer('');
      setResetNewPassword('');
      setView('reset-verification');
    } else {
      // Fallback for old version without QA
      if (window.confirm("Güvenlik sorusu bulunamadı. Tüm veriler silinecek ve kasa sıfırlanacak. Emin misin?")) {
        resetApp();
      }
    }
  };

  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Verify Answer
    if (!verifySecurityAnswer(resetStepAnswer)) {
      showToast('Güvenlik cevabı yanlış.', 'error');
      return;
    }

    // 2. Validate New Password
    if (resetNewPassword.length < 4) {
      showToast('Yeni şifre en az 4 karakter olmalıdır.', 'error');
      return;
    }

    // 3. Reset Password (Keep Data)
    setMasterPassword(resetNewPassword);
    setNotes(getNotes()); // Load existing notes
    setView('dashboard');
    showToast('Şifreniz başarıyla yenilendi!', 'success');
  };

  // Note Handlers
  // Note Handlers
  const handleAddNote = () => {
    if (!inputContent.trim()) {
      showToast('Lütfen not içeriği yazın.', 'error');
      return;
    }

    if (editingNoteId) {
      // Update existing note
      setNotes(prev => prev.map(note =>
        note.id === editingNoteId
          ? { ...note, title: inputTitle.trim() || 'İsimsiz Not', content: inputContent.trim() }
          : note
      ));
      setEditingNoteId(null);
      showToast('Not güncellendi.');
    } else {
      // Add new note
      const newNote: Note = {
        id: Date.now().toString(),
        title: inputTitle.trim() || 'İsimsiz Not',
        content: inputContent.trim(),
        createdAt: Date.now(),
      };
      setNotes(prev => [newNote, ...prev]);
      showToast('Not kasaya eklendi.');
    }

    setInputTitle('');
    setInputContent('');
    setIsNoteInputExpanded(false);
  };

  const handleEditNote = (note: Note, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingNoteId(note.id);
    setInputTitle(note.title);
    setInputContent(note.content);
    setIsNoteInputExpanded(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setInputTitle('');
    setInputContent('');
    setIsNoteInputExpanded(false);
  };

  const handleDeleteNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent copy trigger
    if (window.confirm('Bu notu silmek istediğine emin misin?')) {
      setNotes(prev => prev.filter(n => n.id !== id));
      showToast('Not silindi.', 'info');
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      showToast('Kopyalandı! 📋');
    }).catch(() => {
      showToast('Kopyalama başarısız.', 'error');
    });
  };

  // --- RENDER: SETUP ---
  if (view === 'setup') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-kasa-50 to-kasa-100 dark:from-gray-900 dark:to-gray-950 transition-colors duration-300">
        <Toast toast={toast} onClose={closeToast} />

        {/* Theme Toggle Absolute */}
        <button onClick={toggleTheme} className="absolute top-4 right-4 p-2 rounded-full bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 shadow-sm hover:shadow-md transition-all">
          {theme === 'light' ? <MoonIcon /> : <SunIcon />}
        </button>

        <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl w-full max-w-md text-center border border-kasa-100 dark:border-gray-700 transition-colors duration-300">
          <div className="mb-6 flex justify-center">
            <CrateLogo className="w-24 h-24 animate-pulse" />
          </div>
          <h1 className="text-3xl font-bold text-kasa-800 dark:text-kasa-400 mb-2">Kasa'ya Hoş Geldin</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm">Güvenliğin için bir ana şifre ve unutursan diye bir güvenlik sorusu belirle.</p>

          <form onSubmit={handleSetup} className="space-y-4 text-left">
            {/* Password Input */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Ana Şifre</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="****"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-kasa-500 focus:ring-2 focus:ring-kasa-200 dark:focus:ring-kasa-900 outline-none transition-all text-center text-lg"
                  value={inputPassword}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^\d*$/.test(val)) setInputPassword(val);
                  }}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-kasa-600 dark:hover:text-kasa-400"
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {/* Security Question */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Güvenlik Sorusu</label>
              <select
                value={securityQuestion}
                onChange={(e) => setSecurityQuestion(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:border-kasa-500 outline-none text-sm mb-2"
              >
                <option>İlk evcil hayvanının adı nedir?</option>
                <option>İlkokul öğretmeninin adı nedir?</option>
                <option>Doğduğun şehrin adı nedir?</option>
                <option>En sevdiğin yemek nedir?</option>
              </select>
              <input
                type="text"
                placeholder="Cevap..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-kasa-500 focus:ring-2 focus:ring-kasa-200 dark:focus:ring-kasa-900 outline-none transition-all text-sm"
                value={securityAnswer}
                onChange={(e) => setSecurityAnswer(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="w-full mt-4 bg-kasa-500 hover:bg-kasa-600 text-white font-bold py-3 rounded-xl transition-transform active:scale-95 shadow-lg shadow-kasa-200 dark:shadow-none"
            >
              Şifreyi Oluştur ve Başla
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- RENDER: LOCKED ---
  if (view === 'locked') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-kasa-50 dark:bg-gray-900 transition-colors duration-300">
        <Toast toast={toast} onClose={closeToast} />

        <button onClick={toggleTheme} className="absolute top-4 right-4 p-2 rounded-full bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 shadow-sm hover:shadow-md transition-all">
          {theme === 'light' ? <MoonIcon /> : <SunIcon />}
        </button>

        <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl w-full max-w-sm text-center border-t-4 border-kasa-500 dark:border-kasa-600 transition-colors duration-300">
          <div className="mb-6 flex justify-center">
            <CrateLogo className="w-20 h-20" />
          </div>
          <h2 className="text-2xl font-bold text-kasa-900 dark:text-white mb-6">Kasa Kilitli</h2>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="relative">
              <input
                type="password"
                placeholder="Şifreni Gir"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-kasa-500 focus:ring-2 focus:ring-kasa-200 dark:focus:ring-kasa-900 outline-none transition-all text-center text-lg tracking-widest"
                value={inputPassword}
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^\d*$/.test(val)) setInputPassword(val);
                }}
                inputMode="numeric"
                pattern="[0-9]*"
                autoFocus
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                <LockIcon className="w-5 h-5" />
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-kasa-500 hover:bg-kasa-600 text-white font-bold py-3 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center gap-2"
            >
              <UnlockIcon className="w-5 h-5" />
              Kasayı Aç
            </button>
          </form>

          <button
            onClick={handleForgotPasswordClick}
            className="mt-8 text-xs text-red-300 hover:text-red-500 dark:text-red-400 dark:hover:text-red-300 underline transition-colors"
          >
            Şifremi Unuttum
          </button>
        </div>

        <div className="absolute bottom-6 text-gray-400 dark:text-gray-600 text-sm font-medium tracking-wider opacity-70">
          by Alper Mercan
        </div>
      </div>
    );
  }

  // --- RENDER: RESET VERIFICATION ---
  if (view === 'reset-verification') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <Toast toast={toast} onClose={closeToast} />
        <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl w-full max-w-sm text-center border border-kasa-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-kasa-600 dark:text-kasa-400 mb-4">Şifre Yenileme</h2>
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-6">Güvenlik sorusunu cevaplayarak yeni bir şifre belirleyebilirsin.</p>

          <div className="bg-kasa-50 dark:bg-gray-700 p-4 rounded-xl mb-6 text-kasa-800 dark:text-white font-medium text-sm">
            {resetStepQuestion}
          </div>

          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1 text-left">Cevabın</label>
              <input
                type="text"
                placeholder="Cevap..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-kasa-500 outline-none transition-all"
                value={resetStepAnswer}
                onChange={(e) => setResetStepAnswer(e.target.value)}
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1 text-left">Yeni Şifre</label>
              <input
                type="text"
                placeholder="Yeni şifren"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-kasa-500 outline-none transition-all"
                value={resetNewPassword}
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^\d*$/.test(val)) setResetNewPassword(val);
                }}
                inputMode="numeric"
                pattern="[0-9]*"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-kasa-500 hover:bg-kasa-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-kasa-100 dark:shadow-none transition-transform active:scale-95"
            >
              Şifreyi Yenile ve Aç
            </button>
            <button
              type="button"
              onClick={() => setView('locked')}
              className="w-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-sm py-2"
            >
              Vazgeç
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- RENDER: DASHBOARD ---
  return (
    <div className="min-h-screen bg-kasa-50 dark:bg-gray-900 pb-20 transition-colors duration-300">
      <Toast toast={toast} onClose={closeToast} />

      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10 transition-colors duration-300 border-b border-transparent dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CrateLogo className="w-10 h-10" />
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white tracking-tight">Kasa</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              aria-label="Toggle Dark Mode"
            >
              {theme === 'light' ? <MoonIcon /> : <SunIcon />}
            </button>
            <button
              onClick={() => setView('locked')}
              className="text-sm font-medium text-gray-500 dark:text-gray-300 hover:text-kasa-600 dark:hover:text-kasa-400 bg-gray-100 dark:bg-gray-700 hover:bg-kasa-100 dark:hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors"
            >
              Kilitle
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">

        {/* Add Note Section */}
        <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-kasa-100 dark:border-gray-700 overflow-hidden transition-all duration-300 mb-8 ${isNoteInputExpanded ? 'p-6 ring-2 ring-kasa-200 dark:ring-kasa-900' : 'p-2'}`}>

          {!isNoteInputExpanded ? (
            <div
              onClick={() => setIsNoteInputExpanded(true)}
              className="cursor-text flex items-center gap-3 text-gray-400 dark:text-gray-500 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              <PlusIcon className="w-6 h-6 text-kasa-500" />
              <span className="text-lg">Yeni bir şifre veya not ekle...</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-bold text-kasa-500 uppercase tracking-wider">
                  {editingNoteId ? 'Notu Düzenle' : 'Yeni Not Ekle'}
                </h3>
              </div>
              <input
                type="text"
                placeholder="Başlık (Örn: Banka Kartım)"
                className="w-full text-lg font-bold placeholder-gray-300 dark:placeholder-gray-600 border-none focus:ring-0 p-0 text-gray-800 dark:text-white bg-transparent"
                value={inputTitle}
                onChange={(e) => setInputTitle(e.target.value)}
                autoFocus
              />
              <textarea
                placeholder="Şifre veya gizli notun buraya..."
                className="w-full min-h-[100px] resize-none border-gray-100 dark:border-gray-700 focus:border-kasa-300 dark:focus:border-kasa-600 focus:ring-1 focus:ring-kasa-300 dark:focus:ring-kasa-600 rounded-lg p-3 text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 placeholder-gray-400 dark:placeholder-gray-600"
                value={inputContent}
                onChange={(e) => setInputContent(e.target.value)}
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Vazgeç
                </button>
                <button
                  onClick={handleAddNote}
                  className="px-6 py-2 bg-kasa-500 hover:bg-kasa-600 text-white font-bold rounded-lg transition-colors shadow-md"
                >
                  {editingNoteId ? 'Güncelle' : 'Kasaya At'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Notes Grid */}
        {notes.length === 0 ? (
          <div className="text-center py-20 opacity-50">
            <div className="inline-block p-6 bg-kasa-100 dark:bg-gray-800 rounded-full mb-4">
              <CrateLogo className="w-16 h-16 grayscale opacity-50" />
            </div>
            <p className="text-lg text-gray-500 dark:text-gray-400">Kasa şu an boş.</p>
            <p className="text-sm text-gray-400 dark:text-gray-600">İlk notunu yukarıdan ekleyebilirsin.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {notes.map((note) => (
              <div
                key={note.id}
                onDoubleClick={() => handleCopy(note.content)}
                className="group relative bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm hover:shadow-md border border-gray-100 dark:border-gray-700 hover:border-kasa-300 dark:hover:border-kasa-500 transition-all duration-200 cursor-pointer active:scale-[0.98]"
                title="Kopyalamak için çift tıkla"
              >
                {/* Decoration: Top border */}
                <div className="absolute top-0 left-4 right-4 h-1 bg-kasa-400 rounded-b-md opacity-20 group-hover:opacity-100 transition-opacity"></div>

                <div className="flex justify-between items-start mb-2 mt-2">
                  <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg line-clamp-1">{note.title}</h3>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleEditNote(note, e)}
                      className="text-gray-300 dark:text-gray-600 hover:text-kasa-500 dark:hover:text-kasa-400 p-1 rounded-full hover:bg-kasa-50 dark:hover:bg-kasa-900/30 transition-colors"
                      title="Düzenle"
                    >
                      <EditIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteNote(note.id, e)}
                      className="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                      title="Sil"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>

                <div className="relative bg-gray-50 dark:bg-gray-900 rounded-lg p-3 group-hover:bg-kasa-50 dark:group-hover:bg-gray-900 transition-colors border border-transparent group-hover:border-kasa-100 dark:group-hover:border-kasa-900">
                  <p className="text-gray-600 dark:text-gray-400 font-mono text-sm break-all blur-md group-hover:blur-0 transition-all duration-300 selection:bg-kasa-200 dark:selection:bg-kasa-900">
                    {note.content}
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
                  <span>{new Date(note.createdAt).toLocaleDateString('tr-TR')}</span>
                  <div className="flex items-center gap-1 text-kasa-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <CopyIcon className="w-3 h-3" />
                    <span>Çift tıkla</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Mobile Sticky Note Button */}
      <div className="fixed bottom-6 right-6 lg:hidden">
        <button
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setIsNoteInputExpanded(true);
          }}
          className="bg-kasa-600 text-white p-4 rounded-full shadow-lg hover:bg-kasa-700 active:scale-90 transition-all"
        >
          <PlusIcon className="w-6 h-6" />
        </button>
      </div>

    </div>
  );
};

export default App;