'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Class {
  id: string;
  name: string;
  description?: string;
  capacity: number;
  timezone: string;
  status: string;
  created_at: string;
}

export default function ClassList() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/classes');
      if (!response.ok) {
        throw new Error('Failed to fetch classes');
      }
      const data = await response.json();
      setClasses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading classes...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error: {error}</p>
        <button 
          onClick={fetchClasses}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Classes</h2>
        <Link
          href="/classes/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create New Class
        </Link>
      </div>

      {classes.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📚</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No classes yet</h3>
          <p className="text-gray-600 mb-4">Create your first class to get started</p>
          <Link
            href="/classes/new"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Your First Class
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {classes.map((classItem) => (
            <div key={classItem.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{classItem.name}</h3>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  classItem.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {classItem.status}
                </span>
              </div>
              
              {classItem.description && (
                <p className="text-gray-600 text-sm mb-4">{classItem.description}</p>
              )}
              
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Capacity:</span>
                  <span className="font-medium">{classItem.capacity} participants</span>
                </div>
                <div className="flex justify-between">
                  <span>Timezone:</span>
                  <span className="font-medium">{classItem.timezone}</span>
                </div>
                <div className="flex justify-between">
                  <span>Created:</span>
                  <span className="font-medium">
                    {new Date(classItem.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              <div className="mt-4 flex space-x-2">
                <Link
                  href={`/classes/${classItem.id}`}
                  className="flex-1 bg-blue-600 text-white text-center py-2 px-4 rounded hover:bg-blue-700 transition-colors"
                >
                  View Details
                </Link>
                <Link
                  href={`/classes/${classItem.id}/sessions`}
                  className="flex-1 bg-gray-600 text-white text-center py-2 px-4 rounded hover:bg-gray-700 transition-colors"
                >
                  Sessions
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

