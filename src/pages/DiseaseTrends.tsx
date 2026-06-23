import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, SectionCard, StatusPill } from "@/components/ui-bits";
import { TrendingUp, AlertTriangle, Shield, BarChart3, Thermometer, Loader2 } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";
import { inr } from "@/lib/format";

const DiseaseTrends = () => {
  const { data: diseaseTrends = [], isLoading, error } = useQuery({
    queryKey: ["disease-trends"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("disease_trends")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-[600px] flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="mt-2 text-muted-foreground">Loading disease trends...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <AlertTriangle className="h-6 w-6 text-destructive mb-3" />
        <p className="text-destructive">Error loading disease trends: {error.message}</p>
      </div>
    );
  }

  if (diseaseTrends.length === 0) {
    return (
      <SectionCard className="text-center py-12">
        <AlertTriangle className="h-8 w-8 text-warning mx-auto mb-4" />
        <h3 className="mb-2">No disease trend data available</h3>
        <p className="text-muted-foreground">
          No AI-forecasted health condition trends found for your region.
        </p>
      </SectionCard>
    );
  }

  const activeConditions = diseaseTrends.length;
  const avgConfidence =
    diseaseTrends.reduce((sum, trend) => sum + (trend.confidence_score || 0), 0) /
    diseaseTrends.length;
  const highSeverityAlerts = diseaseTrends.filter(
    (t) => t.severity_level === "high"
  ).length;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Disease Trend Prediction"
        subtitle="AI-forecasted health condition trends in your region"
        icon={<TrendingUp className="h-5 w-5" />}
        titleClassName="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Active Conditions Tracking */}
        <SectionCard className="glass-card">
          <div className="flex items-center space-x-3">
            <Shield className="h-6 w-6 text-primary" />
            <div>
              <h3 className="font-semibold text-foreground">Active Conditions Tracking</h3>
              <p className="text-muted-foreground">{activeConditions} conditions monitored</p>
            </div>
          </div>
        </SectionCard>

        {/* Average Confidence */}
        <SectionCard className="glass-card">
          <div className="flex items-center space-x-3">
            <Thermometer className="h-6 w-6 text-success" />
            <div>
              <h3 className="font-semibold text-foreground">Average Confidence</h3>
              <p className="text-muted-foreground">
                {Math.round(avgConfidence)}% confidence average
              </p>
            </div>
          </div>
        </SectionCard>

        {/* High Severity Alerts */}
        <SectionCard className="glass-card">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <div>
              <h3 className="font-semibold text-foreground">High Severity Alerts</h3>
              <p className="text-muted-foreground">
                {highSeverityAlerts} alerts requiring attention
              </p>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Bar Chart Section */}
      <SectionCard className="glass-card">
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground">
            Predicted Condition Increases
          </h3>
          <p className="text-muted-foreground">
            Expected percentage increase in disease incidence over next 90 days
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={diseaseTrends
                .map((trend) => ({
                  name: trend.condition_name,
                  increase: trend.predicted_increase_percent || 0,
                }))
                .sort((a, b) => b.increase - a.increase)}
              margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tickLine={false} tick={{ fontSize: 12 }} />
              <YAxis tickLine={false} tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value) => `${value}%`}
                contentStyle={{ background: "rgba(0,0,0,0.8)", color: "white", padding: "4px 8px", borderRadius: "4px" }}
                labelStyle={{ color: "#fff", fontWeight: 500 }}
              />
              <Cell>
                {(props) => {
                  const { x, y, width, height, fillColor } = props;
                  return (
                    <rect
                      x={x}
                      y={y}
                      width={width}
                      height={height}
                      rx="4"
                      ry="4"
                      fill={`url(#barGradient)`}
                    />
                  );
                }}
              </Cell>
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#1d4ed8" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      {/* Disease Trend Cards Grid */}
      <SectionCard className="glass-card">
        <h3 className="font-semibold text-foreground mb-4">
          Detailed Trend Analysis
        </h3>
        <div className="grid gap-4 scrollbar-thin">
          {diseaseTrends.map((trend) => (
            <div
              key={trend.id}
              className="glass-card p-4 hover:glow-card transition-all duration-200"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-foreground text-lg">
                    {trend.condition_name}
                  </h3>
                  <StatusPill
                    variant={
                      trend.severity_level === "high"
                        ? "destructive"
                        : trend.severity_level === "medium"
                        ? "warning"
                        : "success"
                    }
                  >
                    {trend.severity_level.charAt(0).toUpperCase() + trend.severity_level.slice(1)}
                  </StatusPill>
                </div>

                <div className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">
                      Predicted Increase:
                    </span>
                    <span className="font-semibold text-primary">
                      {trend.predicted_increase_percent >= 0 ? "+" : ""}{trend.predicted_increase_percent.toFixed(1)}%
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Confidence:</span>
                    <div className="flex-1 bg-muted/20 h-2 rounded overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-green-500 to-yellow-500 h-full transition-all duration-500"
                        style={{ width: `${trend.confidence_score || 0}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-muted-foreground ml-2">
                      {trend.confidence_score || 0}%
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="px-2 py-0.5 bg-muted/20 rounded text-sm">
                      {trend.time_period || "30d"}
                    </span>
                    <span className="px-2 py-0.5 bg-muted/20 rounded text-sm">
                      {trend.geographic_area || "Regional"}
                    </span>
                  </div>

                  {trend.contributing_factors && (
                    <div className="mt-2">
                      <span className="text-xs font-medium text-muted-foreground block mb-1">
                        Contributing Factors:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {trend.contributing_factors
                          .split(",")
                          .map((factor) => (
                            <span
                              key={factor}
                              className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded"
                            >
                              {factor.trim()}
                            </span>
                          ))}
                      </div>
                    </div>
                  )}

                  {trend.preventive_actions && (
                    <div className="mt-2">
                      <span className="text-xs font-medium text-muted-foreground block mb-1">
                        Preventive Actions:
                      </span>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {trend.preventive_actions}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
};

export default DiseaseTrends;