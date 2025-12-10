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
import { BookOpen, Users, Award, Search, AlertCircle } from "lucide-react";
import { useApiProviders, useAllTestSeries } from "@/hooks/useApiData";
import { TestSeriesSkeleton } from "@/components/TestSeriesSkeleton";
import { ApiErrorState, EmptyState } from "@/components/ApiErrorState";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import studyOceanLogo from "@/assets/study-ocean-logo.jpg";

const Home = () => {
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [priceFilter, setPriceFilter] = useState<"all" | "free" | "paid">("all");
  const [sortBy, setSortBy] = useState<"popularity" | "price_low" | "price_high" | "tests">("popularity");
  const navigate = useNavigate();

  const { providers, loading: providersLoading, error: providersError, refetch: refetchProviders } = useApiProviders();
  const { testSeries, loading: seriesLoading, error: seriesError, refetch: refetchSeries } = useAllTestSeries(providers);

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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Welcome to Study Ocean
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Master your subjects with our comprehensive test series. Practice, compete, and excel!
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto mt-12">
            <Card className="border-primary/20">
              <CardContent className="pt-6 text-center">
                <div className="p-3 bg-primary/10 rounded-full w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">100+ Test Series</h3>
                <p className="text-sm text-muted-foreground">Comprehensive coverage</p>
              </CardContent>
            </Card>
            <Card className="border-primary/20">
              <CardContent className="pt-6 text-center">
                <div className="p-3 bg-primary/10 rounded-full w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Global Competition</h3>
                <p className="text-sm text-muted-foreground">Compete with learners</p>
              </CardContent>
            </Card>
            <Card className="border-primary/20">
              <CardContent className="pt-6 text-center">
                <div className="p-3 bg-primary/10 rounded-full w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Track Progress</h3>
                <p className="text-sm text-muted-foreground">Analytics & achievements</p>
              </CardContent>
            </Card>
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
                {providersLoading ? "Loading institutions..." : `Browse ${providers.length} institutions`}
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

          {!seriesLoading && !seriesError && testSeries.length === 0 && providers.length > 0 && (
            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Loading test series...</AlertTitle>
              <AlertDescription>
                The external API server may be experiencing temporary issues. Please try refreshing the page or check back later.
              </AlertDescription>
            </Alert>
          )}

          {(seriesLoading || providersLoading) ? (
            <TestSeriesSkeleton />
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
                  {/* Full-size logo as card background */}
                  <div className="relative h-40 w-full bg-gradient-to-br from-primary/10 to-accent/10 overflow-hidden">
                    <img
                      src={series.logo || studyOceanLogo}
                      alt={series.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = studyOceanLogo;
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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
                      {series.providerName && <span className="text-primary">{series.providerName} • </span>}
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
          ) : !seriesLoading && !seriesError ? (
            <EmptyState message="No test series found matching your filters." />
          ) : null}
        </section>
      </main>
    </div>
  );
};

export default Home;
