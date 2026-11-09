import { useCallback, useEffect, useState } from 'react';
import {
  getInstitutionalMetrics,
  getInstructorProfile,
  listInstructors,
  updateInstructorStatus,
} from '../services/instructorService';
import { getInstructorFichas } from '../services/managementService';

export default function useRoleDashboard(user) {
  const [data, setData] = useState({ instructor: null, fichas: [], instructors: [], metrics: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async ({ silent = false } = {}) => {
    if (!user._id) {
      setLoading(false);
      return;
    }
    if (!silent) setLoading(true);
    setError('');
    try {
      if (user.role === 'instructor') {
        const [instructor, fichas] = await Promise.all([
          getInstructorProfile(user._id),
          getInstructorFichas(),
        ]);
        setData((current) => ({ ...current, instructor, fichas }));
      } else {
        const [instructors, metrics] = await Promise.all([
          listInstructors(),
          getInstitutionalMetrics(),
        ]);
        setData((current) => ({ ...current, instructors, metrics }));
      }
    } catch (loadError) {
      setError(loadError.message || 'No se pudieron cargar los datos del panel.');
    } finally {
      setLoading(false);
    }
  }, [user._id, user.role]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const changeInstructorStatus = useCallback(async (status) => {
    const updated = await updateInstructorStatus(user._id, status);
    setData((current) => ({ ...current, instructor: updated }));
    return updated;
  }, [user._id]);

  return {
    ...data,
    loading,
    error,
    refresh,
    changeInstructorStatus,
  };
}
