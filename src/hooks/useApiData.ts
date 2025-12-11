import { useState, useEffect, useCallback } from "react";
import { apiService, ApiProvider, TestSeries, Subject, TestTitle } from "@/services/apiService";

// Batch requests with concurrency limit to prevent edge function overload
async function batchRequests<T>(
  items: ApiProvider[],
  fetchFn: (item: ApiProvider) => Promise<T[]>,
  concurrency = 5,
  onProgress?: (progress: number) => void
): Promise<{ provider: ApiProvider; data: T[] }[]> {
  const results: { provider: ApiProvider; data: T[] }[] = [];
  const total = items.length;
  let completed = 0;
  
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(
      batch.map(async (item) => {
        const data = await fetchFn(item);
        return { provider: item, data };
      })
    );
    
    batchResults.forEach((result) => {
      completed++;
      if (result.status === 'fulfilled') {
        results.push(result.value);
      }
    });
    
    // Report progress
    if (onProgress) {
      onProgress((completed / total) * 100);
    }
    
    // Small delay between batches to prevent overload
    if (i + concurrency < items.length) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }
  
  return results;
}

export const useApiProviders = () => {
  const [providers, setProviders] = useState<ApiProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.fetchApiProviders();
      // Limit to first 20 providers to reduce load
      setProviders(data.slice(0, 20));
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
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fetchAllSeries = useCallback(async () => {
    if (providers.length === 0) return;
    
    setLoading(true);
    setProgress(0);
    setError(null);
    try {
      // Use batched requests with concurrency limit and progress tracking
      const results = await batchRequests(
        providers,
        (provider) => apiService.fetchTestSeries(provider.api),
        5, // Process 5 providers at a time
        setProgress
      );
      
      // Combine all successful results
      const allSeries: TestSeries[] = [];
      results.forEach(({ provider, data }) => {
        if (data.length > 0) {
          data.forEach(series => {
            allSeries.push({
              ...series,
              providerName: provider.name,
              providerApi: provider.api
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
      setProgress(100);
    }
  }, [providers]);

  useEffect(() => {
    if (providers.length > 0) {
      fetchAllSeries();
    }
  }, [providers, fetchAllSeries]);

  return { testSeries, loading, progress, error, refetch: fetchAllSeries };
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
