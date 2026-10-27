import React, { useState } from 'react';
import { Star } from 'lucide-react';

export default function StarRating({ 
  value = 0, 
  onChange, 
  readOnly = true, 
  size = "md",
  showValue = false 
}) {
  const [hoverValue, setHoverValue] = useState(0);

  const starSizes = {
    sm: "w-3.5 h-3.5",
    md: "w-5 h-5",
    lg: "w-7 h-7",
    xl: "w-9 h-9"
  };

  const currentVal = hoverValue || value;

  return (
    <div className="inline-flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= currentVal;
          const isHalf = !isFilled && star - 0.5 <= currentVal && readOnly;

          return (
            <button
              type="button"
              key={star}
              disabled={readOnly}
              onClick={() => onChange && onChange(star)}
              onMouseEnter={() => !readOnly && setHoverValue(star)}
              onMouseLeave={() => !readOnly && setHoverValue(0)}
              className={`transition-transform ${
                readOnly 
                  ? 'cursor-default' 
                  : 'cursor-pointer hover:scale-125 focus:outline-none focus:scale-125'
              }`}
              aria-label={`Calificar ${star} de 5 estrellas`}
            >
              <Star
                className={`${starSizes[size]} transition-colors duration-150 ${
                  isFilled
                    ? 'fill-amber-400 text-amber-400 drop-shadow-sm'
                    : isHalf
                    ? 'fill-amber-400/50 text-amber-400'
                    : 'text-slate-200 fill-slate-100 hover:text-amber-200'
                }`}
              />
            </button>
          );
        })}
      </div>

      {showValue && (
        <span className="font-bold text-slate-800 text-sm ml-1">
          {Number(value).toFixed(1)}
        </span>
      )}
    </div>
  );
}

