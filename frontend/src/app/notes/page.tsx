'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Note, NoteCategory } from '@/types';
import { 
  getNotes, createNote, updateNote, deleteNote,
  getNoteCategories, createNoteCategory, updateNoteCategory, deleteNoteCategory 
} from '@/lib/api';
import { 
  FileText, Plus, Loader2, Trash2, Check, Search, 
  Calendar as CalendarIcon, X, ArrowLeft, MoreVertical,
  Briefcase, Heart, Home, Settings, Info, Tag
} from 'lucide-react';
import { SectionLoading } from '@/components/ui/SectionLoading';
import { useDialog } from '@/contexts/DialogContext';

import 'react-quill-new/dist/quill.snow.css';

// Dynamically import Quill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false, loading: () => <div className="h-64 flex items-center justify-center bg-gray-50 rounded-2xl animate-pulse"><Loader2 className="animate-spin text-gray-400" /></div> });

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }, { list: 'check' }],
    [{ color: [] }, { background: [] }],
    ['link'],
    ['clean']
  ]
};

const formats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'list',
  'color', 'background',
  'link'
];

const CATEGORY_ICONS: Record<string, any> = {
  'work': Briefcase,
  'heart': Heart,
  'home': Home,
  'settings': Settings,
  'info': Info,
  'tag': Tag,
};

export default function NotesPage() {
  const { showAlert, showConfirm, showPrompt } = useDialog();
  const [categories, setCategories] = useState<NoteCategory[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Navigation State
  const [selectedCategory, setSelectedCategory] = useState<NoteCategory | null>(null);

  // Form Editor State
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Input states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [noteCategory, setNoteCategory] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchNotes(selectedCategory.id);
    } else {
      setNotes([]);
    }
  }, [selectedCategory]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await getNoteCategories();
      setCategories(res.data.results || res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotes = async (categoryId: number) => {
    setLoading(true);
    try {
      const res = await getNotes(categoryId);
      setNotes(res.data.results || res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = useMemo(() => {
    if (!search || selectedCategory) return categories;
    const lowerSearch = search.toLowerCase();
    return categories.filter(c => c.name.toLowerCase().includes(lowerSearch));
  }, [categories, search, selectedCategory]);

  const filteredNotes = useMemo(() => {
    if (!search) return notes;
    const lowerSearch = search.toLowerCase();
    return notes.filter(n => 
      n.title.toLowerCase().includes(lowerSearch) || 
      n.content.replace(/<[^>]*>?/gm, '').toLowerCase().includes(lowerSearch)
    );
  }, [notes, search]);

  const handleCreateCategory = async () => {
    const name = await showPrompt('Kategori Baru', { placeholder: 'Contoh: Pekerjaan, Hubungan, Urusan Rumah' });
    if (!name?.trim()) return;

    try {
      await createNoteCategory({ 
        name, 
        color: '#6366f1', 
        icon: 'tag' 
      });
      fetchCategories();
    } catch (err) {
      console.error(err);
      showAlert('Gagal membuat kategori', { variant: 'error' });
    }
  };

  const handleDeleteCategory = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = await showConfirm('Hapus Kategori?', { 
      message: 'Yakin ingin menghapus kategori ini? Catatan di dalamnya akan tetap ada namun tidak memiliki kategori.' 
    });
    if (!confirmed) return;

    try {
      await deleteNoteCategory(id);
      fetchCategories();
      if (selectedCategory?.id === id) setSelectedCategory(null);
    } catch (err) {
      console.error(err);
      showAlert('Gagal menghapus kategori', { variant: 'error' });
    }
  };

  const handleOpenNew = () => {
    setActiveNote(null);
    setTitle('');
    setContent('');
    setNoteCategory(selectedCategory?.id || null);
    setIsEditing(true);
  };

  const handleOpenEdit = (note: Note) => {
    setActiveNote(note);
    setTitle(note.title);
    setContent(note.content);
    setNoteCategory(note.category);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      if (activeNote) {
        await updateNote(activeNote.id, { title, content, category: noteCategory });
      } else {
        await createNote({ title, content, category: noteCategory });
      }
      setIsEditing(false);
      if (selectedCategory) {
        fetchNotes(selectedCategory.id);
      } else {
        fetchCategories(); // To update counts if displayed
      }
    } catch (err) {
      console.error(err);
      showAlert('Gagal menyimpan catatan', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const confirmed = await showConfirm('Hapus Catatan?', { message: 'Yakin ingin menghapus catatan ini?' });
    if (!confirmed) return;
    try {
      await deleteNote(id);
      if (activeNote?.id === id) {
        setIsEditing(false);
      }
      if (selectedCategory) fetchNotes(selectedCategory.id);
    } catch (err) {
      console.error(err);
      showAlert('Gagal menghapus catatan', { variant: 'error' });
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
  };

  const getIcon = (iconName: string) => {
    const IconComponent = CATEGORY_ICONS[iconName] || Tag;
    return <IconComponent size={24} />;
  };

  return (
    <div className="pb-24">
      {/* Editor Fullscreen Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-[var(--color-bg-app)] animate-slide-up">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--color-border-card)', background: 'var(--color-bg-app)' }}>
            <div className="flex items-center gap-3">
              <button onClick={() => setIsEditing(false)} className="w-9 h-9 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/5 touch-feedback text-[var(--color-text-secondary)]">
                <X size={20} />
              </button>
              <h2 className="text-sm font-bold truncate text-[var(--color-text-primary)]">
                {activeNote ? 'Edit Notes' : 'Notes Baru'}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {activeNote && (
                <button onClick={() => handleDeleteNote(activeNote.id)} className="w-9 h-9 flex items-center justify-center rounded-full bg-rose-50 text-rose-500 touch-feedback">
                  <Trash2 size={18} />
                </button>
              )}
              <button 
                onClick={handleSave} 
                disabled={saving || !title.trim()}
                className="h-9 px-4 flex items-center justify-center gap-1.5 rounded-full text-xs font-bold text-white transition-all disabled:opacity-50"
                style={{ background: 'var(--color-primary)' }}
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Simpan
              </button>
            </div>
          </div>
          
          {/* Editor Body */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            <input 
              type="text" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="Judul Catatan..." 
              className="w-full text-2xl font-bold bg-transparent outline-none border-none placeholder-gray-300 dark:placeholder-gray-600 text-[var(--color-text-primary)]"
            />
            
            {/* Category Select in Form */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              <button
                onClick={() => setNoteCategory(null)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all ${!noteCategory ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-transparent border-[var(--color-border-card)] text-[var(--color-text-muted)]'}`}
              >
                Tanpa Kategori
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setNoteCategory(cat.id)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all ${noteCategory === cat.id ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-transparent border-[var(--color-border-card)] text-[var(--color-text-muted)]'}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            <div className="flex-[1] quill-container min-h-[300px]">
              <ReactQuill 
                theme="snow" 
                value={content} 
                onChange={setContent} 
                modules={modules}
                formats={formats}
                placeholder="Tulis sesuatu di sini..."
                className="h-full pb-10"
              />
            </div>
          </div>
          
          {/* Custom style to fit dark mode better for quill */}
          <style jsx global>{`
            .quill-container .ql-toolbar {
              border-color: var(--color-border-card) !important;
              background-color: var(--color-bg-card);
              border-top-left-radius: 12px;
              border-top-right-radius: 12px;
            }
            .quill-container .ql-container {
              border-color: var(--color-border-card) !important;
              border-bottom-left-radius: 12px;
              border-bottom-right-radius: 12px;
              font-family: inherit;
              font-size: 14px;
            }
            .quill-container .ql-editor {
              min-height: 250px;
              color: var(--color-text-primary);
            }
            .quill-container .ql-editor.ql-blank::before {
              color: var(--color-text-muted);
              font-style: normal;
            }
            .dark .ql-stroke { stroke: var(--color-text-primary) !important; }
            .dark .ql-fill { fill: var(--color-text-primary) !important; }
            .dark .ql-picker { color: var(--color-text-primary) !important; }
            .dark .ql-picker-options { background-color: var(--color-bg-card) !important; border-color: var(--color-border-card) !important; }
          `}</style>
        </div>
      )}

      {/* Main Page Header */}
      <div className="page-header" style={{ paddingBottom: '36px' }}>
        <div className="flex items-center gap-3">
          {selectedCategory && (
            <button 
              onClick={() => setSelectedCategory(null)}
              className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white/10 text-white touch-feedback"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <div>
            <p className="text-[10px] text-white/70 font-medium uppercase tracking-wider">
              {selectedCategory ? 'Kategori Catatan' : 'Internal Catatan'}
            </p>
            <h1 className="text-xl font-bold text-white">
              {selectedCategory ? selectedCategory.name : 'Notes'}
            </h1>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-4 relative animate-fade-in-up">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search size={16} className="text-white/60" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-3 rounded-2xl text-sm placeholder-white/60 text-white outline-none focus:ring-2 focus:ring-white/30 transition-all"
            style={{ background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(8px)' }}
            placeholder={selectedCategory ? `Cari di ${selectedCategory.name}...` : "Cari kategori atau catatan..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div style={{ padding: '0 var(--page-px)' }} className="-mt-4">
        {loading ? (
          <SectionLoading height="300px" />
        ) : !selectedCategory ? (
          /* CATEGORY GRID VIEW */
          <div className="grid grid-cols-2 gap-3 animate-fade-in-up">
            {filteredCategories.map((cat) => (
              <div 
                key={cat.id} 
                onClick={() => setSelectedCategory(cat)}
                className="mobile-card p-4 touch-feedback group relative overflow-hidden"
              >
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mb-4 text-indigo-500 group-hover:scale-110 transition-transform">
                    {getIcon(cat.icon)}
                  </div>
                  <h3 className="font-bold text-sm text-[var(--color-text-primary)] mb-1">{cat.name}</h3>
                  <p className="text-[10px] text-[var(--color-text-secondary)]">{cat.note_count || 0} Catatan</p>
                </div>
                
                <button 
                  onClick={(e) => handleDeleteCategory(cat.id, e)}
                  className="absolute top-2 right-2 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--color-text-muted)] hover:text-rose-500"
                >
                  <Trash2 size={14} />
                </button>

                {/* Decorative background light */}
                <div 
                  className="absolute -bottom-4 -right-4 w-16 h-16 blur-2xl opacity-10 rounded-full"
                  style={{ background: cat.color || 'var(--color-primary)' }}
                />
              </div>
            ))}
            
            {/* Empty State Categories */}
            {filteredCategories.length === 0 && (
              <div className="col-span-2 py-12 text-center text-[var(--color-text-secondary)]">
                <Tag className="mx-auto mb-3 opacity-20" size={48} />
                <p className="text-sm font-medium">Belum ada kategori</p>
                <button 
                  onClick={handleCreateCategory}
                  className="mt-2 text-xs font-bold text-[var(--color-primary)] bg-indigo-50 dark:bg-indigo-500/10 px-4 py-2 rounded-full"
                >
                  Buat Kategori Pertama
                </button>
              </div>
            )}
          </div>
        ) : (
          /* NOTE LIST VIEW (Filtered by Category) */
          <div className="space-y-3 animate-fade-in-up">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredNotes.map((note) => (
                <div 
                  key={note.id} 
                  onClick={() => handleOpenEdit(note)}
                  className="mobile-card p-4 touch-feedback flex flex-col min-h-[120px]"
                >
                  <div className="flex-1">
                    <h3 className="font-bold text-sm mb-1 text-[var(--color-text-card-title)] line-clamp-2">
                      {note.title}
                    </h3>
                    <div 
                      className="text-xs line-clamp-2 opacity-70 text-[var(--color-text-secondary)]" 
                      dangerouslySetInnerHTML={{ __html: note.content || '<em>Kosong</em>' }}
                    />
                  </div>
                  
                  <div className="mt-4 pt-3 flex items-center justify-between border-t border-[var(--color-divider)]">
                    <div className="flex items-center gap-1.5 opacity-60 text-[var(--color-text-muted)]">
                      <CalendarIcon size={12} />
                      <span className="text-[10px] font-medium">{formatDate(note.updated_at)}</span>
                    </div>
                    <button onClick={(e) => handleDeleteNote(note.id, e)} className="p-1.5 hover:bg-rose-50 text-rose-400 rounded-lg touch-feedback transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredNotes.length === 0 && (
              <div className="py-16 text-center animate-fade-in-up">
                <FileText className="mx-auto mb-4 opacity-20 text-indigo-400" size={64} />
                <h3 className="text-base font-bold text-[var(--color-text-primary)] mb-1">Belum Ada Catatan</h3>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  Mulai menulis catatan di kategori ini.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* FAB */}
      <button 
        onClick={!selectedCategory ? handleCreateCategory : handleOpenNew} 
        className="fab z-[70]"
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>
    </div>
  );
}
