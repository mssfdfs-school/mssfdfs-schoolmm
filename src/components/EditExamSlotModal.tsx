/**
 * EditExamSlotModal Component
 * نافذة تعديل جلسة امتحان رسمية (اليوم والتاريخ، المادة، التوقيت، القاعة، المراقبات)
 * خاصة بالسيدة المديرة وإدارة المدرسة
 * ثانوية ميسان للمتميزات
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ExamScheduleSlot, GradeLevel } from '../types';
import {
  X,
  Save,
  Calendar,
  Clock,
  BookOpen,
  Building2,
  Users,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Plus,
  Trash2,
  Tag,
  FileText,
  UserCheck,
  UserPlus,
  Check,
} from 'lucide-react';

interface EditExamSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  slot: ExamScheduleSlot | null;
  scheduleTitle?: string;
  onSave: (updatedSlot: ExamScheduleSlot) => void;
}

const WEEK_DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'السبت'];

const IRAQI_EXAM_SUBJECTS = [
  'التربية الإسلامية والقرآن الكريم',
  'اللغة العربية (القواعد والأدب والنقد والإنشاء)',
  'اللغة الإنجليزية (English for Iraq - Advanced)',
  'اللغة الفرنسية (Français)',
  'الرياضيات المتقدمة (Advanced Mathematics)',
  'علم الأحياء (Biology)',
  'الكيمياء (Chemistry)',
  'الفيزياء (Physics)',
  'الحاسوب والذكاء الاصطناعي (Computer Science & AI)',
  'الاجتماعيات (التاريخ والجغرافيا والوطنية)',
  'الاقتصاد',
];

const DEFAULT_EXAM_HALLS = [
  'القاعة المركزية الكبرى (المدرج الرئيسي)',
  'قاعة الخوارزمي للمتميزات',
  'قاعة ابن الهيثم للعلوم المتقدمة',
  'قاعة نازك الملائكة للأدب واللغات',
  'قاعة المعمارية زها حديد',
  'مختبر الحاسوب والذكاء الاصطناعي',
  'قاعة مريم العذراء',
  'قاعة المتفوقات - الطابق الثاني',
];

const TIME_PRESETS = [
  '08:30 ص - 11:00 ص (ساعتان ونصف)',
  '08:30 ص - 10:30 ص (ساعتان)',
  '08:30 ص - 11:30 ص (3 ساعات - الرياضيات والفيزياء)',
  '12:30 م - 03:00 م (الفترة الامتحانية الثانية)',
];

const GRADE_LEVELS_OPTIONS: { value: GradeLevel | 'all'; label: string }[] = [
  { value: 'all', label: 'كافة الصفوف (المتوسطة والإعدادية)' },
  { value: 'الصف الأول المتوسط', label: 'الصف الأول متوسط' },
  { value: 'الصف الثاني المتوسط', label: 'الصف الثاني متوسط' },
  { value: 'الصف الثالث المتوسط', label: 'الصف الثالث متوسط (الوزاري)' },
  { value: 'الصف الرابع العلمي', label: 'الصف الرابع العلمي' },
  { value: 'الصف الخامس العلمي', label: 'الصف الخامس العلمي' },
  { value: 'الصف السادس العلمي', label: 'الصف السادس العلمي (الوزاري)' },
];

export const EditExamSlotModal: React.FC<EditExamSlotModalProps> = ({
  isOpen,
  onClose,
  slot,
  scheduleTitle,
  onSave,
}) => {
  const { teachers, role, currentUser } = useApp();

  // Permission check: strictly restricted to Principal and School Admin
  const isAuthorizedAdmin =
    role === 'admin' ||
    currentUser?.role === 'admin' ||
    currentUser?.role === 'principal' ||
    currentUser?.id === 'admin-principal' ||
    (currentUser?.name && (currentUser.name.includes('المديرة') || currentUser.name.includes('الهام')));

  // Form states
  const [dayName, setDayName] = useState<string>('الأحد');
  const [date, setDate] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [customSubject, setCustomSubject] = useState<string>('');
  const [isCustomSubject, setIsCustomSubject] = useState<boolean>(false);
  const [time, setTime] = useState<string>('08:30 ص - 11:00 ص');
  const [hallOrRoom, setHallOrRoom] = useState<string>('القاعة المركزية الكبرى (المدرج الرئيسي)');
  const [customHall, setCustomHall] = useState<string>('');
  const [isCustomHall, setIsCustomHall] = useState<boolean>(false);
  const [gradeLevel, setGradeLevel] = useState<GradeLevel | 'all'>('all');
  const [proctors, setProctors] = useState<string[]>([]);
  const [newProctorTeacherId, setNewProctorTeacherId] = useState<string>('');
  const [customProctorName, setCustomProctorName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [errorText, setErrorText] = useState<string>('');
  const [proctorNotice, setProctorNotice] = useState<string>('');
  const [isSavedSuccess, setIsSavedSuccess] = useState<boolean>(false);

  // Sync state when slot changes
  useEffect(() => {
    if (slot) {
      setDayName(slot.dayName || 'الأحد');
      setDate(slot.date || '');

      const isKnownSub = IRAQI_EXAM_SUBJECTS.includes(slot.subject);
      if (isKnownSub) {
        setSubject(slot.subject);
        setIsCustomSubject(false);
        setCustomSubject('');
      } else {
        setSubject('مخصص');
        setIsCustomSubject(true);
        setCustomSubject(slot.subject || '');
      }

      setTime(slot.time || '08:30 ص - 11:00 ص');

      const isKnownHall = DEFAULT_EXAM_HALLS.includes(slot.hallOrRoom || '');
      if (isKnownHall) {
        setHallOrRoom(slot.hallOrRoom || DEFAULT_EXAM_HALLS[0]);
        setIsCustomHall(false);
        setCustomHall('');
      } else if (slot.hallOrRoom) {
        setHallOrRoom('مخصص');
        setIsCustomHall(true);
        setCustomHall(slot.hallOrRoom);
      } else {
        setHallOrRoom(DEFAULT_EXAM_HALLS[0]);
        setIsCustomHall(false);
        setCustomHall('');
      }

      setGradeLevel(slot.gradeLevel || 'all');
      setProctors(slot.proctors ? [...slot.proctors] : []);
      setNotes(slot.notes || '');
      setErrorText('');
    }
  }, [slot, isOpen]);

  if (!isOpen || !slot) return null;

  // Auto-detect day name when date changes
  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    if (!newDate) return;
    try {
      const parsedDate = new Date(newDate);
      if (!isNaN(parsedDate.getTime())) {
        const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
        const calculatedDay = days[parsedDate.getDay()];
        if (calculatedDay) {
          setDayName(calculatedDay);
        }
      }
    } catch {
      // Keep existing dayName if date parsing fails
    }
  };

  // Helper to format teacher name with official title
  const formatProctorName = (rawName: string) => {
    const trimmed = rawName.trim();
    if (!trimmed) return '';
    if (
      trimmed.startsWith('أ.') ||
      trimmed.startsWith('د.') ||
      trimmed.startsWith('م.') ||
      trimmed.startsWith('الأستاذة') ||
      trimmed.startsWith('الدكتورة') ||
      trimmed.startsWith('المهندس') ||
      trimmed.startsWith('مدرسة')
    ) {
      return trimmed;
    }
    return `أ. ${trimmed}`;
  };

  // Add Proctor from Teachers list (Supports direct ID or state value)
  const handleAddProctorFromSelect = (overrideTeacherId?: string) => {
    const targetId = overrideTeacherId || newProctorTeacherId;

    if (!targetId) {
      // If user clicked this button but had already typed a custom name, insert that instead of failing!
      if (customProctorName.trim()) {
        handleAddCustomProctor();
        return;
      }
      setProctorNotice('يرجى تحديد مدرسة من القائمة المنسدلة أولاً لإدراجها.');
      setTimeout(() => setProctorNotice(''), 3500);
      return;
    }

    const found = teachers.find((t) => t.id === targetId);
    if (!found) return;

    const formatted = formatProctorName(found.name);
    if (proctors.includes(formatted)) {
      setProctorNotice(`المراقبة (${formatted}) مدرجة مسبقاً في هذه الجلسة.`);
      setTimeout(() => setProctorNotice(''), 3500);
      return;
    }

    setProctors((prev) => [...prev, formatted]);
    setNewProctorTeacherId('');
    setProctorNotice(`تم إدراج (${formatted}) في مراقبة القاعة بنجاح ✓`);
    setTimeout(() => setProctorNotice(''), 3500);
  };

  // Add Custom Proctor Name (Handles both custom text & selected teacher fallback)
  const handleAddCustomProctor = () => {
    const trimmed = customProctorName.trim();

    // If custom name is empty, check if a teacher was selected in the dropdown and insert them!
    if (!trimmed) {
      if (newProctorTeacherId) {
        handleAddProctorFromSelect(newProctorTeacherId);
        return;
      }
      setProctorNotice('يرجى كتابة اسم المراقبة أو اختيار مدرسة من القائمة لإدراجها.');
      setTimeout(() => setProctorNotice(''), 3500);
      return;
    }

    const formatted = formatProctorName(trimmed);
    if (proctors.includes(formatted)) {
      setProctorNotice(`المراقبة (${formatted}) مدرجة مسبقاً في هذه الجلسة.`);
      setTimeout(() => setProctorNotice(''), 3500);
      return;
    }

    setProctors((prev) => [...prev, formatted]);
    setCustomProctorName('');
    setProctorNotice(`تم إدراج (${formatted}) في مراقبة القاعة بنجاح ✓`);
    setTimeout(() => setProctorNotice(''), 3500);
  };

  // Quick 1-click toggle proctor from faculty chip
  const handleToggleProctor = (teacherName: string) => {
    const formatted = formatProctorName(teacherName);
    if (proctors.includes(formatted)) {
      setProctors((prev) => prev.filter((p) => p !== formatted));
      setProctorNotice(`تم حذف (${formatted}) من مراقبة الجلسة.`);
    } else {
      setProctors((prev) => [...prev, formatted]);
      setProctorNotice(`تم إدراج (${formatted}) في مراقبة القاعة بنجاح ✓`);
    }
    setTimeout(() => setProctorNotice(''), 3500);
  };

  // Remove Proctor
  const handleRemoveProctor = (indexToRemove: number) => {
    const removedName = proctors[indexToRemove];
    setProctors(proctors.filter((_, idx) => idx !== indexToRemove));
    if (removedName) {
      setProctorNotice(`تم إزالة (${removedName}) من مراقبة الجلسة.`);
      setTimeout(() => setProctorNotice(''), 3000);
    }
  };

  // Save changes
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthorizedAdmin) {
      setErrorText('عذراً، صلاحية تعديل جدول الامتحانات محصورة بحساب السيدة المديرة وإدارة المدرسة فقط.');
      return;
    }

    const finalSubject = isCustomSubject ? customSubject.trim() : subject.trim();
    if (!finalSubject) {
      setErrorText('يرجى تحديد أو إدخال اسم المادة الدراسية.');
      return;
    }

    if (!date.trim()) {
      setErrorText('يرجى إدخال تاريخ الامتحان بصيغة صحيحة.');
      return;
    }

    if (!time.trim()) {
      setErrorText('يرجى إدخال توقيت ومدة الامتحان.');
      return;
    }

    const finalHall = isCustomHall ? customHall.trim() : hallOrRoom.trim();

    const updatedSlot: ExamScheduleSlot = {
      ...slot,
      dayName,
      date,
      subject: finalSubject,
      time,
      hallOrRoom: finalHall || 'القاعة المركزية الكبرى',
      gradeLevel,
      proctors,
      notes: notes.trim(),
    };

    setIsSavedSuccess(true);
    setTimeout(() => {
      onSave(updatedSlot);
      setIsSavedSuccess(false);
      onClose();
    }, 900);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto font-arabic"
      dir="rtl"
    >
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl p-6 text-slate-100 space-y-5 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">تعديل جلسة امتحان رسمي</h3>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2.5 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>خاص بالمديرة والإدارة</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {scheduleTitle ? `جدول: ${scheduleTitle}` : 'تعديل اليوم والتاريخ، المادة، التوقيت، القاعة، والمراقبات'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security / RBAC Banner */}
        {!isAuthorizedAdmin ? (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
            <div className="space-y-1">
              <p className="font-black">تنبيه: خاص بالسيدة المديرة وإدارة المدرسة 🔒</p>
              <p className="text-[11px] text-rose-200/90 leading-relaxed">
                أنت لست مسجلاً بحساب المديرة أو الإدارة المدرسية المخولة. الصلاحية مقتصرة على الإدارة لضمان سرية وانضباط الجداول الامتحانية الرسمية.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 text-xs flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-[11px]">
              تم التحقق من الصلاحية: مسموح لكِ بتعديل اليوم والتاريخ، المادة، التوقيت، القاعة الامتحانية، والمراقبات وحفظها فورياً.
            </span>
          </div>
        )}

        {/* Main Edit Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Section 1: اليوم والتاريخ (Day and Date) */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-3">
            <div className="flex items-center gap-2 text-xs font-black text-amber-300">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>1. اليوم والتاريخ الامتحاني:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  اليوم: <span className="text-rose-400">*</span>
                </label>
                <select
                  value={dayName}
                  onChange={(e) => setDayName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  {WEEK_DAYS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  التاريخ (YYYY-MM-DD): <span className="text-rose-400">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono font-bold focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </div>

          {/* Section 2: المادة الدراسية والمرحلة (Subject and Grade) */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-black text-amber-300">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>2. المادة الدراسية المقررة:</span>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomSubject(!isCustomSubject)}
                className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer"
              >
                {isCustomSubject ? '← اختيار من المنهاج الرسمي' : '+ كتابة اسم مادة مخصصة'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  اسم المادة: <span className="text-rose-400">*</span>
                </label>
                {!isCustomSubject ? (
                  <select
                    value={subject}
                    onChange={(e) => {
                      if (e.target.value === 'مخصص') {
                        setIsCustomSubject(true);
                      } else {
                        setSubject(e.target.value);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    {IRAQI_EXAM_SUBJECTS.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                    <option value="مخصص">+ مادة أخرى مخصصة...</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    placeholder="اكتبي اسم المادة المخصصة بالتفصيل..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-amber-500/60 text-amber-200 text-xs font-bold focus:outline-none focus:border-amber-400"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">المرحلة المشمولة:</label>
                <select
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value as GradeLevel | 'all')}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  {GRADE_LEVELS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: التوقيت والقاعة الامتحانية (Time and Hall) */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-3">
            <div className="flex items-center gap-2 text-xs font-black text-amber-300">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>3. التوقيت والقاعة الامتحانية:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Timing */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  توقيت الامتحان ومدته: <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder="08:30 ص - 11:00 ص"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono font-bold focus:outline-none focus:border-amber-400"
                />
                {/* Time Presets */}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {TIME_PRESETS.map((tPreset) => (
                    <button
                      key={tPreset}
                      type="button"
                      onClick={() => setTime(tPreset.split(' ')[0] + ' - ' + tPreset.split(' ')[2] + ' ص')}
                      className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                    >
                      {tPreset.split('(')[0].trim()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hall */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-300">
                    القاعة الامتحانية: <span className="text-rose-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCustomHall(!isCustomHall)}
                    className="text-[10px] text-indigo-400 hover:underline cursor-pointer"
                  >
                    {isCustomHall ? '← القاعات الافتراضية' : '+ قاعة مخصصة'}
                  </button>
                </div>

                {!isCustomHall ? (
                  <select
                    value={hallOrRoom}
                    onChange={(e) => {
                      if (e.target.value === 'مخصص') {
                        setIsCustomHall(true);
                      } else {
                        setHallOrRoom(e.target.value);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    {DEFAULT_EXAM_HALLS.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                    <option value="مخصص">+ إدخال قاعة أخرى...</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    value={customHall}
                    onChange={(e) => setCustomHall(e.target.value)}
                    placeholder="مثال: القاعة رقم 3 - الجناح الشرقي"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-amber-500/60 text-amber-200 text-xs font-bold focus:outline-none focus:border-amber-400"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Section 4: المراقبات والمشرفات (Proctors) */}
          <div className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700/80 space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-black text-amber-300">
                <Users className="w-4 h-4 text-amber-400" />
                <span>4. المراقبات والمشرفون على القاعة:</span>
              </div>
              <span className="text-[11px] font-bold text-amber-400/90 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                {proctors.length > 0 ? `${proctors.length} مراقبات ومُشرفات محددات` : 'لم تُحدد مراقبات بعد'}
              </span>
            </div>

            {/* Notification Banner for Proctor Insertion */}
            {proctorNotice && (
              <div className="p-2.5 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-200 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{proctorNotice}</span>
              </div>
            )}

            {/* Existing Proctors Chips */}
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-700/80 min-h-[48px] flex flex-wrap items-center gap-2">
              {proctors.length > 0 ? (
                proctors.map((proc, pIdx) => (
                  <span
                    key={pIdx}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-950/80 to-slate-900 text-indigo-200 border border-indigo-500/40 text-xs font-bold shadow-sm"
                  >
                    <span className="w-4 h-4 rounded-full bg-indigo-600/60 text-[10px] flex items-center justify-center text-white font-mono">
                      {pIdx + 1}
                    </span>
                    <span>{proc}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveProctor(pIdx)}
                      className="text-slate-400 hover:text-rose-400 transition-colors cursor-pointer p-0.5 rounded hover:bg-rose-500/10"
                      title={`إزالة ${proc} من المراقبة`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400 py-1 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400/80 shrink-0" />
                  <span>لم يتم تعيين مراقبات لهذه الجلسة بعد. اختاري من القائمة أو اكتبي اسماً ثم اضغطي زر <strong>إدراج</strong>.</span>
                </span>
              )}
            </div>

            {/* Dual Insertion Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {/* Box 1: Dropdown Selection with Active Insert Button */}
              <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-700/60 space-y-2">
                <label className="block text-[11px] font-bold text-slate-300">
                  أ. اختيار من كادر المدرسات المعتمد:
                </label>
                <div className="flex gap-2">
                  <select
                    value={newProctorTeacherId}
                    onChange={(e) => {
                      setNewProctorTeacherId(e.target.value);
                      if (e.target.value) {
                        setProctorNotice('');
                      }
                    }}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    <option value="">-- اختاري مدرسة من القائمة --</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.subject || t.specialization || 'مدرسة'})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleAddProctorFromSelect()}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all shadow-md active:scale-95 ${
                      newProctorTeacherId
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border border-emerald-400/30 ring-2 ring-emerald-500/30'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400/30'
                    }`}
                    title="إدراج المراقبة المختارة في القاعة"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>إدراج المراقبة</span>
                  </button>
                </div>
              </div>

              {/* Box 2: Custom Proctor Name with Active Insert Button */}
              <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-700/60 space-y-2">
                <label className="block text-[11px] font-bold text-slate-300">
                  ب. إدخال اسم مراقبة مخصص / خارجي:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customProctorName}
                    onChange={(e) => {
                      setCustomProctorName(e.target.value);
                      if (e.target.value) {
                        setProctorNotice('');
                      }
                    }}
                    placeholder="اكتبي اسم مراقبة أو مشرفة..."
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomProctor();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomProctor}
                    className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all shadow-md active:scale-95 ${
                      customProctorName.trim()
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 border border-amber-300 ring-2 ring-amber-400/40'
                        : 'bg-slate-700 hover:bg-slate-600 text-white border border-slate-600'
                    }`}
                    title="إدراج اسم المراقبة في القاعة"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إدراج</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick 1-Click Badges from Faculty */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>إدراج سريع بنقرة واحدة من كادر المدرسات المعتمد:</span>
                </span>
                <span className="text-[10px] text-slate-500">انقري على الاسم للإدراج الفوري</span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 rounded-xl bg-slate-900/40 border border-slate-800">
                {teachers.slice(0, 14).map((t) => {
                  const formatted = formatProctorName(t.name);
                  const isSelected = proctors.includes(formatted);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleToggleProctor(t.name)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-600 text-white border border-emerald-400 shadow-sm'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:text-white'
                      }`}
                      title={isSelected ? `إلغاء إدراج ${t.name}` : `إدراج ${t.name} بنقرة واحدة`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-200" />
                          <span>{t.name} (مدرجة ✓)</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3 h-3 text-amber-400" />
                          <span>{t.name}</span>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 5: الملاحظات والتنبيهات الامتحانية (Notes) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300">
              تنبيهات وملاحظات الجلسة الامتحانية (اختياري):
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: يرجى جلب الأدوات الهندسية والآلة الحاسبة العلمية غير المبرمجة، والالتزام بالزي المدرسي الموحد."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Error Message */}
          {errorText && (
            <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorText}</span>
            </div>
          )}

          {/* Success Banner */}
          {isSavedSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-bounce">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>تم حفظ واعتماد تعديل بيانات الجلسة الامتحانية بنجاح!</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <div className="text-[11px] text-slate-400">
              سيتم تحديث الجداول الرسمية وكشوفات المراقبة فور الحفظ.
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                إلغاء
              </button>

              <button
                type="submit"
                disabled={!isAuthorizedAdmin}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs shadow-lg shadow-amber-400/20 flex items-center gap-2 transition-all cursor-pointer transform hover:scale-105"
              >
                <Save className="w-4 h-4" />
                <span>حفظ واعتماد التعديل</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
