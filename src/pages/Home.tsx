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
import { BookOpen, Users, Award, Search, Loader2 } from "lucide-react";
import { useApiProviders, useTestSeries } from "@/hooks/useApiData";

const Home = () => {
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [priceFilter, setPriceFilter] = useState<"all" | "free" | "paid">("all");
  const [sortBy, setSortBy] = useState<"popularity" | "price_low" | "price_high" | "tests">("popularity");
  const navigate = useNavigate();

  const { providers, loading: providersLoading } = useApiProviders();
  const { testSeries, loading: seriesLoading } = useTestSeries(selectedProvider);

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

  // Set default provider when providers load
  useEffect(() => {
    if (providers.length > 0 && !selectedProvider) {
      setSelectedProvider(providers[0].api);
    }
  }, [providers, selectedProvider]);

  // Save selected API URL for TestSeries page
  useEffect(() => {
    if (selectedProvider) {
      localStorage.setItem("selectedApiUrl", selectedProvider);
    }
  }, [selectedProvider]);

  // Filter and sort test series
  const filteredTestSeries = testSeries
    .filter((series) => {
      const matchesSearch = series.series_name.toLowerCase().includes(searchQuery.toLowerCase());
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
          return b.total_tests - a.total_tests;
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
        {/* Institution Selector */}
        <div className="mb-8">
          <label className="text-sm font-medium mb-2 block">Select Institution</label>
          <Select
            value={selectedProvider || undefined}
            onValueChange={setSelectedProvider}
            disabled={providersLoading}
          >
            <SelectTrigger className="w-full md:w-96">
              <SelectValue placeholder="Choose an institution..." />
            </SelectTrigger>
            <SelectContent>
              {providers.map((provider, index) => (
                <SelectItem key={`${provider.api}-${index}`} value={provider.api}>
                  {provider.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Test Series Section */}
        <section className="mb-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <h2 className="text-3xl font-bold mb-2">Available Test Series</h2>
              <p className="text-muted-foreground">Browse and start your learning journey</p>
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

          {seriesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading test series...</span>
            </div>
          ) : filteredTestSeries.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTestSeries.map((series) => (
                <Card
                  key={series.test_id}
                  className="hover:shadow-lg transition-smooth cursor-pointer group"
                  onClick={() => navigate(`/test-series/${series.test_id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-3">
                      {series.series_logo && (
                        <img
                          src={series.series_logo}
                          alt={series.series_name}
                          className="h-12 w-12 object-contain rounded"
                        />
                      )}
                      <Badge variant={series.is_paid ? "default" : "secondary"}>
                        {series.is_paid ? `₹${series.price}` : "Free"}
                      </Badge>
                    </div>
                    <CardTitle className="group-hover:text-primary transition-smooth">
                      {series.series_name}
                    </CardTitle>
                    <CardDescription>
                      {series.total_tests} tests • {series.validity_days} days validity
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full" variant="outline">
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No test series found. Try a different search or filter.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Home;
