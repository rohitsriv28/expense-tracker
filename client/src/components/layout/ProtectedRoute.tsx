import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import useOfflineStatus from "../../hooks/useOfflineStatus";
import type { ReactElement } from "react";
import { useState, useEffect, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProtectedRouteProps {
  children: ReactElement;
  fallback?: ReactElement;
}

// ─── Loading Screen ───────────────────────────────────────────────────────────
//
// Shown while AuthContext is resolving the session on mount.
// Design intent: calm, branded, progress-aware. The animated SVG ring
// gives a sense of intentional progress rather than indefinite waiting.
// Transitions to content smoothly via opacity fade.

function LoadingScreen() {
  const isOffline = useOfflineStatus();

  // Animate the progress ring from 0% to ~80% over 1.5s, then hold.
  // We never reach 100% until auth actually resolves — avoids the
  // misleading "complete" state when the check is still in flight.
  const [progress, setProgress] = useState(0);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Ramp up quickly at first, then slow to a crawl approaching 80
    progressRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 80) {
          if (progressRef.current) clearInterval(progressRef.current);
          return 80;
        }
        // Decelerate as we approach the ceiling
        const remaining = 80 - prev;
        const step = Math.max(0.3, remaining * 0.06);
        return prev + step;
      });
    }, 40);

    return () => {
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, []);

  // SVG ring parameters
  const SIZE = 80;
  const STROKE = 3;
  const RADIUS = (SIZE - STROKE) / 2;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const dashOffset = CIRCUMFERENCE - (progress / 100) * CIRCUMFERENCE;

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--bg-app)" }}
      role="status"
      aria-label="Loading your dashboard"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-8 text-center max-w-xs">
        {/* ── Logo + progress ring ── */}
        <div className="relative flex items-center justify-center">
          {/* Animated SVG ring — the signature element */}
          <svg
            width={SIZE}
            height={SIZE}
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            fill="none"
            aria-hidden="true"
            style={{ transform: "rotate(-90deg)" }}
          >
            {/* Track */}
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              strokeWidth={STROKE}
              stroke="var(--border)"
            />
            {/* Fill */}
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              strokeWidth={STROKE}
              stroke="var(--interactive)"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              style={{ transition: "stroke-dashoffset 80ms linear" }}
            />
          </svg>

          {/* CashFlow logomark — centered inside the ring */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            aria-hidden="true"
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 28 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Stylised bar-chart / cash-flow mark */}
              <rect
                x="3"
                y="16"
                width="5"
                height="9"
                rx="1.5"
                fill="var(--interactive)"
                opacity="0.4"
              />
              <rect
                x="11.5"
                y="10"
                width="5"
                height="15"
                rx="1.5"
                fill="var(--interactive)"
                opacity="0.7"
              />
              <rect
                x="20"
                y="3"
                width="5"
                height="22"
                rx="1.5"
                fill="var(--interactive)"
              />
            </svg>
          </div>
        </div>

        {/* ── Text ── */}
        <div className="space-y-1.5">
          <p
            className="font-semibold tracking-tight"
            style={{
              fontSize: "var(--text-lg)",
              color: "var(--text-primary)",
              letterSpacing: "-0.01em",
            }}
          >
            Opening CashFlow
          </p>
          <p
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--text-secondary)",
              lineHeight: 1.5,
            }}
          >
            {isOffline
              ? "You're offline — loading from cache"
              : "Verifying your session"}
          </p>
        </div>

        {/* ── Offline indicator ── */}
        {isOffline && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-full"
            style={{
              background: "var(--status-warning-bg)",
              border: "1px solid var(--status-warning-bdr)",
            }}
          >
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{ background: "var(--status-warning-text)" }}
              aria-hidden="true"
            />
            <span
              className="font-medium"
              style={{
                fontSize: "var(--text-xs)",
                color: "var(--status-warning-text)",
              }}
            >
              No internet connection
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
//
// Shown after 2.5s if auth is still resolving — communicates the app's layout
// so the transition into the real dashboard feels continuous rather than jarring.
// Uses the design system's .skeleton shimmer class and CSS variable tokens.

function LoadingSkeleton() {
  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--bg-app)" }}
      aria-hidden="true"
    >
      {/* Header */}
      <div
        className="sticky top-0 z-40 border-b"
        style={{
          background: "var(--bg-header)",
          borderColor: "var(--border)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[var(--header-h,3.75rem)]">
            {/* Logo area */}
            <div className="flex items-center gap-3">
              <div
                className="skeleton w-9 h-9 rounded-xl"
                style={{ background: "var(--bg-skeleton)" }}
              />
              <div className="space-y-1.5">
                <div
                  className="skeleton h-4 w-20 rounded"
                  style={{ background: "var(--bg-skeleton)" }}
                />
                <div
                  className="skeleton h-2.5 w-14 rounded"
                  style={{ background: "var(--bg-skeleton)" }}
                />
              </div>
            </div>
            {/* Nav actions */}
            <div className="flex items-center gap-3">
              <div
                className="skeleton h-8 w-8 rounded-lg"
                style={{ background: "var(--bg-skeleton)" }}
              />
              <div
                className="skeleton h-8 w-8 rounded-full"
                style={{ background: "var(--bg-skeleton)" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Page body */}
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Stat cards row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[72, 88, 60, 80].map((w, i) => (
            <div
              key={i}
              className="rounded-xl p-5 space-y-3"
              style={{
                background: "var(--bg-card)",
                border: "var(--card-border)",
                boxShadow: "var(--card-shadow)",
              }}
            >
              <div className="flex items-center justify-between">
                <div
                  className="skeleton h-3 rounded"
                  style={{
                    width: `${w}%`,
                    background: "var(--bg-skeleton)",
                  }}
                />
                <div
                  className="skeleton w-7 h-7 rounded-lg"
                  style={{ background: "var(--bg-skeleton)" }}
                />
              </div>
              <div
                className="skeleton h-7 w-28 rounded"
                style={{ background: "var(--bg-skeleton)" }}
              />
              <div
                className="skeleton h-2.5 w-20 rounded"
                style={{ background: "var(--bg-skeleton)" }}
              />
            </div>
          ))}
        </div>

        {/* Main content split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart area — 2 cols */}
          <div
            className="lg:col-span-2 rounded-xl p-5 space-y-4"
            style={{
              background: "var(--bg-card)",
              border: "var(--card-border)",
              boxShadow: "var(--card-shadow)",
            }}
          >
            <div className="flex items-center justify-between">
              <div
                className="skeleton h-4 w-32 rounded"
                style={{ background: "var(--bg-skeleton)" }}
              />
              <div
                className="skeleton h-7 w-24 rounded-full"
                style={{ background: "var(--bg-skeleton)" }}
              />
            </div>
            {/* Chart bars */}
            <div className="flex items-end gap-2 pt-2 h-32">
              {[55, 80, 45, 90, 60, 75, 40, 85, 65, 70].map((h, i) => (
                <div
                  key={i}
                  className="skeleton flex-1 rounded-t"
                  style={{
                    height: `${h}%`,
                    background: "var(--bg-skeleton)",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Budget panel — 1 col */}
          <div
            className="rounded-xl p-5 space-y-3"
            style={{
              background: "var(--bg-card)",
              border: "var(--card-border)",
              boxShadow: "var(--card-shadow)",
            }}
          >
            <div
              className="skeleton h-4 w-28 rounded"
              style={{ background: "var(--bg-skeleton)" }}
            />
            {[65, 80, 45].map((pct, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div
                    className="skeleton h-3 w-20 rounded"
                    style={{ background: "var(--bg-skeleton)" }}
                  />
                  <div
                    className="skeleton h-3 w-10 rounded"
                    style={{ background: "var(--bg-skeleton)" }}
                  />
                </div>
                {/* Progress track */}
                <div
                  className="h-1.5 w-full rounded-full"
                  style={{ background: "var(--status-neutral-bg)" }}
                >
                  <div
                    className="skeleton h-1.5 rounded-full"
                    style={{
                      width: `${pct}%`,
                      background: "var(--bg-skeleton)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Transaction list */}
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: "var(--bg-card)",
            border: "var(--card-border)",
            boxShadow: "var(--card-shadow)",
          }}
        >
          <div
            className="px-5 py-4 border-b flex items-center justify-between"
            style={{ borderColor: "var(--border)" }}
          >
            <div
              className="skeleton h-4 w-36 rounded"
              style={{ background: "var(--bg-skeleton)" }}
            />
            <div
              className="skeleton h-7 w-16 rounded-full"
              style={{ background: "var(--bg-skeleton)" }}
            />
          </div>
          <div
            className="divide-y"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            {[1, 2, 3, 4, 5].map((_, i) => (
              <div key={i} className="px-5 py-3.5 flex items-center gap-4">
                <div
                  className="skeleton w-9 h-9 rounded-xl flex-shrink-0"
                  style={{ background: "var(--bg-skeleton)" }}
                />
                <div className="flex-1 space-y-1.5">
                  <div
                    className="skeleton h-3.5 rounded"
                    style={{
                      width: `${[55, 70, 45, 65, 50][i]}%`,
                      background: "var(--bg-skeleton)",
                    }}
                  />
                  <div
                    className="skeleton h-2.5 w-20 rounded"
                    style={{ background: "var(--bg-skeleton)" }}
                  />
                </div>
                <div
                  className="skeleton h-4 w-16 rounded flex-shrink-0"
                  style={{ background: "var(--bg-skeleton)" }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ProtectedRoute ───────────────────────────────────────────────────────────

export default function ProtectedRoute({
  children,
  fallback,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);

  // Show skeleton after 2.5s — slightly longer than before so the
  // loading screen has time to establish before the transition
  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => setShowSkeleton(true), 2500);
    return () => clearTimeout(timer);
  }, [loading]);

  // Fade in when auth resolves to avoid a hard cut to content
  useEffect(() => {
    if (!loading) {
      const raf = requestAnimationFrame(() => setFadeIn(true));
      return () => cancelAnimationFrame(raf);
    }
  }, [loading]);

  // Custom fallback takes priority
  if (loading && fallback) return fallback;

  // Loading states
  if (loading) {
    return showSkeleton ? <LoadingSkeleton /> : <LoadingScreen />;
  }

  // Redirect unauthenticated users
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Render protected content with a subtle fade-in
  return (
    <div
      style={{
        opacity: fadeIn ? 1 : 0,
        transition: "opacity 180ms ease",
      }}
    >
      {children}
    </div>
  );
}
