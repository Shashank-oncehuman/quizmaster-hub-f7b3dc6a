import { useState, useEffect } from "react";
import { apiService, ApiProvider, TestSeries, Subject, TestTitle } from "@/services/apiService";

export const useApiProviders = () => {
  const [providers, setProviders] = useState<ApiProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const data = await apiService.fetchApiProviders();
        setProviders(data);
      } catch (err) {
        setError("Failed to load API providers");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, []);

  return { providers, loading, error };
};

export const useTestSeries = (apiUrl: string | null) => {
  const [testSeries, setTestSeries] = useState<TestSeries[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!apiUrl) return;

    const fetchSeries = async () => {
      setLoading(true);
      try {
        const data = await apiService.fetchTestSeries(apiUrl);
        setTestSeries(data);
      } catch (err) {
        setError("Failed to load test series");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSeries();
  }, [apiUrl]);

  return { testSeries, loading, error };
};

export const useSubjects = (apiUrl: string | null, testId: string | null) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!apiUrl || !testId) return;

    const fetchSubjects = async () => {
      setLoading(true);
      try {
        const data = await apiService.fetchSubjects(apiUrl, testId);
        setSubjects(data);
      } catch (err) {
        setError("Failed to load subjects");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, [apiUrl, testId]);

  return { subjects, loading, error };
};

export const useTestTitles = (
  apiUrl: string | null,
  testId: string | null,
  subjectId: string | null
) => {
  const [testTitles, setTestTitles] = useState<TestTitle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!apiUrl || !testId || !subjectId) return;

    const fetchTitles = async () => {
      setLoading(true);
      try {
        const data = await apiService.fetchTestTitles(apiUrl, testId, subjectId);
        setTestTitles(data);
      } catch (err) {
        setError("Failed to load test titles");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTitles();
  }, [apiUrl, testId, subjectId]);

  return { testTitles, loading, error };
};
