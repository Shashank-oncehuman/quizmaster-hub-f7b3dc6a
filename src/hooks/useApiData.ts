import { useState, useEffect, useCallback } from "react";
import { apiService, ApiProvider, TestSeries, Subject, TestTitle } from "@/services/apiService";

export const useApiProviders = () => {
  const [providers, setProviders] = useState<ApiProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.fetchApiProviders();
      setProviders(data);
    } catch (err) {
      setError("Failed to load API providers");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  return { providers, loading, error, refetch: fetchProviders };
};

export const useAllTestSeries = (providers: ApiProvider[]) => {
  const [testSeries, setTestSeries] = useState<TestSeries[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllSeries = useCallback(async () => {
    if (providers.length === 0) return;
    
    setLoading(true);
    setError(null);
    try {
      // Fetch from all providers in parallel
      const results = await Promise.allSettled(
        providers.map(provider => apiService.fetchTestSeries(provider.api))
      );
      
      // Combine all successful results
      const allSeries: TestSeries[] = [];
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.length > 0) {
          // Add provider name to each series for reference
          result.value.forEach(series => {
            allSeries.push({
              ...series,
              providerName: providers[index].name,
              providerApi: providers[index].api
            });
          });
        }
      });
      
      setTestSeries(allSeries);
    } catch (err) {
      setError("Failed to load test series");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [providers]);

  useEffect(() => {
    if (providers.length > 0) {
      fetchAllSeries();
    }
  }, [providers, fetchAllSeries]);

  return { testSeries, loading, error, refetch: fetchAllSeries };
};

export const useSubjects = (apiUrl: string | null, testId: string | null) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSubjects = useCallback(async () => {
    if (!apiUrl || !testId) return;

    setLoading(true);
    setError(null);
    try {
      const data = await apiService.fetchSubjects(apiUrl, testId);
      setSubjects(data);
    } catch (err) {
      setError("Failed to load subjects");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, testId]);

  useEffect(() => {
    if (apiUrl && testId) {
      fetchSubjects();
    }
  }, [apiUrl, testId, fetchSubjects]);

  return { subjects, loading, error, refetch: fetchSubjects };
};

export const useTestTitles = (
  apiUrl: string | null,
  testId: string | null,
  subjectId: string | null
) => {
  const [testTitles, setTestTitles] = useState<TestTitle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTitles = useCallback(async () => {
    if (!apiUrl || !testId || !subjectId) return;

    setLoading(true);
    setError(null);
    try {
      const data = await apiService.fetchTestTitles(apiUrl, testId, subjectId);
      setTestTitles(data);
    } catch (err) {
      setError("Failed to load test titles");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, testId, subjectId]);

  useEffect(() => {
    if (apiUrl && testId && subjectId) {
      fetchTitles();
    }
  }, [apiUrl, testId, subjectId, fetchTitles]);

  return { testTitles, loading, error, refetch: fetchTitles };
};
