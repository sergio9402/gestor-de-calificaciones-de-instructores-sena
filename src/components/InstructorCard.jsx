import React from 'react';
import { Star, BookOpen, Building2, MessageSquare, Award, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import StarRating from './StarRating';

export default function InstructorCard({ instructor, onEvaluate, onSelect }) {
  // Color classification based on rating
  const getBadgeColor = (rating) => {
    if (rating >= 4.7) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (rating >= 4.0) return 'bg-blue-50 text-blue-700 border-blue-200';
    return 'bg-amber-50 text-amber-700 border-amber-200';
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:border-[#39A900]/40">
      <div>
        {/* Card Header & Profile */}
        <div className="p-5 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="relative">
                <img
                  src={instructor.avatar}
                  alt={instructor.name}
                  className="w-16 h-16 rounded-2xl object-cover ring-2 ring-slate-100 group-hover:ring-[#39A900] transition-all duration-300 shadow-sm"
                />
                <span className="absolute -bottom-1 -right-1 bg-[#39A900] text-white p-0.5 rounded-full ring-2 ring-white">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </span>
              </div>
              <div>
                <span className={`inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full border mb-1 ${getBadgeColor(instructor.rating)}`}>
                  {instructor.rating >= 4.7 ? 'Instructor Destacado' : 'Instructor Certificado'}
                </span>
                <h3 className="font-bold text-slate-900 text-base group-hover:text-[#00324D] transition-colors leading-snug">
                  {instructor.name}
                </h3>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate max-w-[210px]">{instructor.center}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Module Banner */}
          <div className="mt-4 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#00324D] mb-1">
              <BookOpen className="w-3.5 h-3.5 text-[#39A900] shrink-0" />
              <span className="line-clamp-1">{instructor.module}</span>
            </div>
            <div className="flex flex-wrap gap-1 mt-1.5">
              {instructor.tags.slice(0, 3).map((tag, idx) => (
                <span key={idx} className="text-[10px] bg-white text-slate-600 px-2 py-0.5 rounded-md border border-slate-200">
                  {tag}
                </span>
              ))}
              {instructor.tags.length > 3 && (
                <span className="text-[10px] bg-white text-slate-400 px-1.5 py-0.5 rounded-md border border-slate-200">
                  +{instructor.tags.length - 3}
                </span>
              )}
            </div>
          </div>

          {/* Star Rating & General Score */}
          <div className="mt-4 flex items-center justify-between p-3 bg-amber-50/50 rounded-xl border border-amber-100/80">
            <div>
              <span className="text-[11px] font-semibold text-amber-900 block">Calificación General</span>
              <div className="flex items-center gap-2 mt-0.5">
                <StarRating value={instructor.rating} size="sm" />
                <span className="text-base font-extrabold text-amber-950">{instructor.rating.toFixed(1)}</span>
                <span className="text-xs text-amber-700/80">/ 5.0</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-500 font-medium block">Evaluaciones</span>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 bg-white px-2 py-0.5 rounded-lg border border-slate-200 shadow-2xs mt-0.5">
                <MessageSquare className="w-3 h-3 text-[#39A900]" />
                {instructor.ratingsCount}
              </span>
            </div>
          </div>

          {/* Competency Micro-Bars (Metodología y Dominio Técnico) */}
          <div className="mt-4 space-y-2.5">
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#39A900]"></span> Metodología
                </span>
                <span className="font-bold text-slate-800">{instructor.methodology.toFixed(1)}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-[#39A900] to-emerald-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(instructor.methodology / 5) * 100}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#00324D]"></span> Dominio Técnico
                </span>
                <span className="font-bold text-slate-800">{instructor.technicalDomain.toFixed(1)}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-[#00324D] to-cyan-700 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(instructor.technicalDomain / 5) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card Actions */}
      <div className="p-4 pt-3 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
        <button
          onClick={() => onSelect(instructor)}
          className="flex-1 py-2 px-3 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5"
        >
          <span>Ver Reseñas</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
        </button>
        <button
          onClick={() => onEvaluate(instructor)}
          className="flex-1 py-2 px-3 text-xs font-semibold text-white bg-[#39A900] hover:bg-[#2e8a00] rounded-xl transition-all shadow-sm hover:shadow flex items-center justify-center gap-1.5"
        >
          <Star className="w-3.5 h-3.5 fill-white text-white" />
          <span>Calificar</span>
        </button>
      </div>
    </div>
  );
}

