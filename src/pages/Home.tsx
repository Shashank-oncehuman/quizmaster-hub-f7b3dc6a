import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BookOpen, Users, Award, Search } from "lucide-react";
import { useApiProviders, useAllTestSeries } from "@/hooks/useApiData";
import { TestSeriesSkeleton } from "@/components/TestSeriesSkeleton";
import { ApiErrorState, EmptyState } from "@/components/ApiErrorState";
import { LoadingProgress } from "@/components/LoadingProgress";
import studyOceanLogo from "@/assets/study-ocean-logo.jpg";

const Home = () => {
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [priceFilter, setPriceFilter] = useState<"all" | "free" | "paid">("all");
  const [sortBy, setSortBy] = useState<"popularity" | "price_low" | "price_high" | "tests">("popularity");
  const navigate = useNavigate();

  const { providers, loading: providersLoading, error: providersError, refetch: refetchProviders } = useApiProviders();
  const { testSeries, loading: seriesLoading, progress, error: seriesError, refetch: refetchSeries } = useAllTestSeries(providers);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);


  // Filter and sort test series
  const filteredTestSeries = (testSeries || [])
    .filter((series) => {
      const matchesSearch = series.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPrice =
        priceFilter === "all" ||
        (priceFilter === "free" && !series.is_paid) ||
        (priceFilter === "paid" && series.is_paid);
      return matchesSearch && matchesPrice;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price_low":
          return (a.price || 0) - (b.price || 0);
        case "price_high":
          return (b.price || 0) - (a.price || 0);
        case "tests":
          return (b.total_tests || 0) - (a.total_tests || 0);
        default:
          return 0;
      }
    });

  const isLoading = providersLoading || seriesLoading;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent animate-fade-in">
            Welcome to Study Ocean
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '100ms' }}>
            Master your subjects with our comprehensive test series. Practice, compete, and excel!
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto mt-12">
            {[
              { icon: BookOpen, title: "100+ Test Series", desc: "Comprehensive coverage" },
              { icon: Users, title: "Global Competition", desc: "Compete with learners" },
              { icon: Award, title: "Track Progress", desc: "Analytics & achievements" }
            ].map((item, idx) => (
              <Card 
                key={idx} 
                className="border-primary/20 animate-fade-in transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                style={{ animationDelay: `${(idx + 2) * 100}ms` }}
              >
                <CardContent className="pt-6 text-center">
                  <div className="p-3 bg-primary/10 rounded-full w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <main className="container mx-auto px-4 py-12">
        {/* Test Series Section */}
        <section className="mb-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <h2 className="text-3xl font-bold mb-2">Available Test Series</h2>
              <p className="text-muted-foreground">
                {isLoading 
                  ? `Loading from ${providers.length} institutions...` 
                  : `Found ${testSeries.length} test series from ${providers.length} institutions`
                }
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search test series..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={priceFilter} onValueChange={(value: any) => setPriceFilter(value)}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popularity">Popular</SelectItem>
                  <SelectItem value="price_low">Price: Low</SelectItem>
                  <SelectItem value="price_high">Price: High</SelectItem>
                  <SelectItem value="tests">Most Tests</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {providersError && (
            <ApiErrorState 
              title="Failed to load institutions" 
              message={providersError}
              onRetry={refetchProviders}
            />
          )}

          {seriesError && !seriesLoading && (
            <ApiErrorState 
              title="Failed to load test series" 
              message={seriesError}
              onRetry={refetchSeries}
            />
          )}

          {isLoading ? (
            <LoadingProgress 
              progress={progress} 
              message={providersLoading ? "Fetching institutions..." : "Loading test series..."} 
            />
          ) : filteredTestSeries.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTestSeries.map((series, index) => (
                <Card
                  key={`${series.id}-${series.providerApi}-${index}`}
                  className="hover:shadow-xl transition-all duration-300 ease-out cursor-pointer group overflow-hidden animate-fade-in hover:-translate-y-1"
                  style={{ animationDelay: `${Math.min(index * 50, 500)}ms` }}
                  onClick={() => {
                    if (series.providerApi) {
                      localStorage.setItem("selectedApiUrl", series.providerApi);
                    }
                    navigate(`/test-series/${series.id}`);
                  }}
                >
                  {/* Full-size logo as card background - only for institution cards */}
                  <div className="relative h-40 w-full bg-gradient-to-br from-primary/10 to-accent/10 overflow-hidden">
                    <img
                      src={studyOceanLogo}
                      alt={series.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                    <Badge 
                      variant={series.is_paid ? "default" : "secondary"}
                      className="absolute top-3 right-3 transition-transform duration-300 group-hover:scale-105"
                    >
                      {series.is_paid ? `₹${series.price}` : "Free"}
                    </Badge>
                  </div>
                  <CardHeader className="pt-4">
                    <CardTitle className="group-hover:text-primary transition-colors duration-300 text-lg line-clamp-2">
                      {series.name}
                    </CardTitle>
                    <CardDescription className="transition-colors duration-300">
                      {series.providerName && <span className="text-primary font-medium">{series.providerName}</span>}
                      {series.providerName && " • "}
                      {series.total_tests} tests {series.expiresOn && `• ${series.expiresOn}`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground" variant="outline">
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : !isLoading && !seriesError ? (
            <EmptyState message="No test series found matching your filters." />
          ) : null}
        </section>
      </main>
    </div>
  );
};

export default Home;
