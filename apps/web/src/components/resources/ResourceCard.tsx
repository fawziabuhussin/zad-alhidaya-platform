'use client';

import { Resource } from '@/types/resource';

interface ResourceCardProps {
  resource: Resource;
  showActions?: boolean;
  onEdit?: (resource: Resource) => void;
  onDelete?: (resourceId: string) => void;
}

export default function ResourceCard({
  resource,
  showActions = false,
  onEdit,
  onDelete,
}: ResourceCardProps) {
  return (
    <div className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-teal-300 transition">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2 flex-1">
          <svg
            className="w-5 h-5 text-gray-600 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h4 className="text-lg font-semibold text-gray-800">{resource.title}</h4>
        </div>
        {showActions && (
          <div className="flex gap-2">
            <button
              onClick={() => onEdit?.(resource)}
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition text-sm font-semibold"
            >
              تعديل
            </button>
            <button
              onClick={() => onDelete?.(resource.id)}
              className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition text-sm font-semibold"
            >
              حذف
            </button>
          </div>
        )}
      </div>
      
      {resource.description && (
        <p className="text-gray-600 text-sm mb-3">{resource.description}</p>
      )}
      
      <a
        href={resource.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-primary hover:underline font-semibold text-sm"
      >
        <svg
          className="w-4 h-4 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
          />
        </svg>
        <span>افتح الرابط</span>
      </a>
    </div>
  );
}
