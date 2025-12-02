// API Service for fetching data from external APIs via edge function proxy

const PROXY_URL = "https://zmpnwnmowuvsndvfgjql.supabase.co/functions/v1/proxy-api";

export interface ApiProvider {
  name: string;
  api: string;
}

export interface TestSeries {
  test_id: string;
  series_name: string;
  series_logo: string;
  is_paid: boolean;
  total_tests: number;
  validity_days: number;
  price?: number;
}

export interface Subject {
  subject_id: string;
  subject_name: string;
  subject_logo: string;
  total_tests: number;
}

export interface TestTitle {
  title_id: string;
  title_name: string;
  duration_minutes: number;
  total_questions: number;
  total_marks: number;
  questions_json_url: string;
  is_completed: boolean;
  remaining_attempts: number;
}

export interface QuizQuestion {
  question_id: string;
  question_text: string;
  options: string[];
  correct_answer: number;
  explanation?: string;
}

async function proxyFetch(url: string) {
  const response = await fetch(`${PROXY_URL}?url=${encodeURIComponent(url)}`);
  if (!response.ok) {
    throw new Error(`Proxy fetch failed: ${response.statusText}`);
  }
  return response.json();
}

class ApiService {
  private baseUrl = "https://studyuk.site/appx.php";

  async fetchApiProviders(): Promise<ApiProvider[]> {
    try {
      return await proxyFetch("https://studyuk.site/appxapis.json");
    } catch (error) {
      console.error("Error fetching API providers:", error);
      return [];
    }
  }

  async fetchTestSeries(apiUrl: string): Promise<TestSeries[]> {
    try {
      const url = `${this.baseUrl}?bash_url=${encodeURIComponent(apiUrl)}&action=series`;
      const response = await proxyFetch(url);
      return Array.isArray(response) ? response : (response?.data || []);
    } catch (error) {
      console.error("Error fetching test series:", error);
      return [];
    }
  }

  async fetchSubjects(apiUrl: string, testId: string): Promise<Subject[]> {
    try {
      const url = `${this.baseUrl}?bash_url=${encodeURIComponent(apiUrl)}&action=subjects&test_id=${testId}`;
      const response = await proxyFetch(url);
      return Array.isArray(response) ? response : (response?.data || []);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      return [];
    }
  }

  async fetchTestTitles(apiUrl: string, testId: string, subjectId: string): Promise<TestTitle[]> {
    try {
      const url = `${this.baseUrl}?bash_url=${encodeURIComponent(apiUrl)}&action=titles&test_id=${testId}&subject_id=${subjectId}`;
      const response = await proxyFetch(url);
      return Array.isArray(response) ? response : (response?.data || []);
    } catch (error) {
      console.error("Error fetching test titles:", error);
      return [];
    }
  }

  async fetchQuizQuestions(questionsJsonUrl: string): Promise<QuizQuestion[]> {
    try {
      return await proxyFetch(questionsJsonUrl);
    } catch (error) {
      console.error("Error fetching quiz questions:", error);
      return [];
    }
  }
}

export const apiService = new ApiService();
