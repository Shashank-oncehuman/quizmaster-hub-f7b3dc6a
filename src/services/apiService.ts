// API Service for fetching data from external APIs via edge function proxy

const PROXY_URL = "https://zmpnwnmowuvsndvfgjql.supabase.co/functions/v1/proxy-api";

export interface ApiProvider {
  name: string;
  api: string;
}

export interface TestSeries {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  is_paid: boolean;
  total_tests: number;
  expiresOn?: string;
  price?: number;
}

export interface Subject {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  total_tests: number;
}

export interface TestTitle {
  id: string;
  name: string;
  slug: string;
  duration: number;
  totalQuestions: number;
  totalMarks: number;
  questionsUrl: string;
  isPremium: boolean;
  attemptCount?: number;
}

export interface QuizQuestion {
  qid: string;
  question: string;
  options: { id: string; value: string }[];
  answer: string;
  solution?: string;
}

async function proxyFetch(url: string) {
  console.log('[API Service] Fetching:', url);
  const response = await fetch(`${PROXY_URL}?url=${encodeURIComponent(url)}`);
  if (!response.ok) {
    throw new Error(`Proxy fetch failed: ${response.statusText}`);
  }
  const data = await response.json();
  console.log('[API Service] Response:', data);
  return data;
}

class ApiService {
  private baseUrl = "https://studyuk.site/appx.php";

  async fetchApiProviders(): Promise<ApiProvider[]> {
    try {
      const data = await proxyFetch("https://studyuk.site/appxapis.json");
      console.log('[API Service] Providers count:', Array.isArray(data) ? data.length : 0);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Error fetching API providers:", error);
      return [];
    }
  }

  async fetchTestSeries(apiUrl: string): Promise<TestSeries[]> {
    try {
      const url = `${this.baseUrl}?bash_url=${encodeURIComponent(apiUrl)}&action=series`;
      const response = await proxyFetch(url);
      console.log('[API Service] Test series response:', response);
      
      // Check for API error messages
      if (response?.msg === "Invalid Token" || response?.status === 401) {
        console.warn('[API Service] Invalid Token - this institution may require authentication');
        return [];
      }
      
      // Handle different response formats
      const items = Array.isArray(response) ? response : (response?.data || []);
      
      // Map the API response to our interface
      return items.map((item: any) => ({
        id: item.id || item.test_id || String(item.slug || Math.random()),
        name: item.name || item.series_name || 'Unnamed Series',
        slug: item.slug || '',
        logo: item.logo || item.series_logo || '',
        is_paid: item.is_paid || false,
        total_tests: item.total_tests || item.totalTests || 0,
        expiresOn: item.expiresOn || item.validity_days,
        price: item.price || 0,
      }));
    } catch (error) {
      console.error("Error fetching test series:", error);
      return [];
    }
  }

  async fetchSubjects(apiUrl: string, testId: string): Promise<Subject[]> {
    try {
      const url = `${this.baseUrl}?bash_url=${encodeURIComponent(apiUrl)}&action=subjects&test_id=${testId}`;
      const response = await proxyFetch(url);
      console.log('[API Service] Subjects response:', response);
      
      const items = Array.isArray(response) ? response : (response?.data || []);
      
      return items.map((item: any) => ({
        id: item.id || item.subject_id || String(item.slug),
        name: item.name || item.subject_name || 'Unnamed Subject',
        slug: item.slug || '',
        logo: item.logo || item.subject_logo || '',
        total_tests: item.total_tests || item.totalTests || 0,
      }));
    } catch (error) {
      console.error("Error fetching subjects:", error);
      return [];
    }
  }

  async fetchTestTitles(apiUrl: string, testId: string, subjectId: string): Promise<TestTitle[]> {
    try {
      const url = `${this.baseUrl}?bash_url=${encodeURIComponent(apiUrl)}&action=titles&test_id=${testId}&subject_id=${subjectId}`;
      const response = await proxyFetch(url);
      console.log('[API Service] Test titles response:', response);
      
      const items = Array.isArray(response) ? response : (response?.data || []);
      
      return items.map((item: any) => ({
        id: item.id || item.title_id || String(item.slug),
        name: item.name || item.title_name || 'Unnamed Test',
        slug: item.slug || '',
        duration: item.duration || item.duration_minutes || 30,
        totalQuestions: item.totalQuestions || item.total_questions || 0,
        totalMarks: item.totalMarks || item.total_marks || 0,
        questionsUrl: item.questionsUrl || item.questions_json_url || '',
        isPremium: item.isPremium || item.is_premium || false,
        attemptCount: item.attemptCount || item.remaining_attempts || 0,
      }));
    } catch (error) {
      console.error("Error fetching test titles:", error);
      return [];
    }
  }

  async fetchQuizQuestions(questionsJsonUrl: string): Promise<QuizQuestion[]> {
    try {
      const data = await proxyFetch(questionsJsonUrl);
      console.log('[API Service] Quiz questions response:', data);
      
      const items = Array.isArray(data) ? data : (data?.data || data?.questions || []);
      
      return items.map((item: any) => ({
        qid: item.qid || item.question_id || String(Math.random()),
        question: item.question || item.question_text || '',
        options: item.options || [],
        answer: item.answer || item.correct_answer || '',
        solution: item.solution || item.explanation || '',
      }));
    } catch (error) {
      console.error("Error fetching quiz questions:", error);
      return [];
    }
  }
}

export const apiService = new ApiService();
