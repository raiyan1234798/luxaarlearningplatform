"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useTheme } from "@/components/providers/ThemeProvider";
import {
  BookOpen,
  Play,
  Shield,
  Zap,
  Star,
  Moon,
  Sun,
  ArrowRight,
  CheckCircle,
  Users,
  Award,
} from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Private & Secure",
    desc: "Invite-only access. Every user is approved by an admin before gaining entry.",
  },
  {
    icon: Play,
    title: "Premium Videos",
    desc: "Stream content from Google Drive or GitHub. Fast, secure, no downloads.",
  },
  {
    icon: Zap,
    title: "Track Progress",
    desc: "Resume where you left off. Completion badges, certificates, and analytics.",
  },
  {
    icon: BookOpen,
    title: "Rich Content",
    desc: "Structured courses with markdown notes, downloadable resources, and quizzes.",
  },
];

const stats = [
  { label: "Courses", value: "500+" },
  { label: "Learners", value: "12K+" },
  { label: "Completion Rate", value: "94%" },
  { label: "Instructors", value: "80+" },
];

const testimonials = [
  {
    name: "Sarah K.",
    role: "Software Engineer",
    text: "Luxaar completely changed how I approach online learning. The content is world-class.",
    rating: 5,
  },
  {
    name: "Marcus B.",
    role: "Product Designer",
    text: "The UX is flawless. Clean, distraction-free, and actually keeps me engaged.",
    rating: 5,
  },
  {
    name: "Priya N.",
    role: "Data Scientist",
    text: "Finally a platform that respects my time. Curated, high-quality, no fluff.",
    rating: 5,
  },
];

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
        overflowX: "hidden",
      }}
    >
      {/* Nav */}
      <nav
        className="glass"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          padding: "14px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          style={{ display: "flex", alignItems: "center", gap: 10 }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "linear-gradient(135deg, #c9a84c, #a07830)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <BookOpen size={18} color="#0a0a0a" />
          </div>
          <span
            style={{
              fontFamily: "Poppins, sans-serif",
              fontWeight: 700,
              fontSize: 20,
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
            }}
          >
            Luxaar
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          style={{ display: "flex", alignItems: "center", gap: 12 }}
        >
          <button
            onClick={toggleTheme}
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "8px",
              cursor: "pointer",
              color: "var(--text-secondary)",
              display: "flex",
              alignItems: "center",
            }}
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <Link href="/login">
            <button className="btn-secondary" style={{ fontSize: 13, padding: "8px 16px" }}>
              Sign In
            </button>
          </Link>
          <Link href="/signup">
            <button className="btn-primary" style={{ fontSize: 13, padding: "8px 16px" }}>
              Request Access
            </button>
          </Link>
        </motion.div>
      </nav>

      {/* Hero */}
      <section
        style={{
          padding: "100px 24px 80px",
          maxWidth: 900,
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 14px",
            borderRadius: 999,
            background: "rgba(201,168,76,0.1)",
            border: "1px solid rgba(201,168,76,0.3)",
            marginBottom: 24,
          }}
        >
          <Star size={12} color="#c9a84c" fill="#c9a84c" />
          <span style={{ fontSize: 12, color: "#c9a84c", fontWeight: 500 }}>
            Private Learning. Exceptional Quality.
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            fontFamily: "Poppins, sans-serif",
            fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            color: "var(--text-primary)",
            marginBottom: 20,
          }}
        >
          Learn from the{" "}
          <span className="gradient-text">world&apos;s best</span>
          <br />
          in a private space.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            fontSize: "clamp(1rem, 2vw, 1.2rem)",
            color: "var(--text-secondary)",
            maxWidth: 560,
            margin: "0 auto 40px",
            lineHeight: 1.7,
          }}
        >
          Luxaar is an invite-only platform where curated knowledge meets
          premium design. Apply for access and unlock a world of structured,
          distraction-free learning.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}
        >
          <Link href="/signup">
            <button className="btn-primary" style={{ fontSize: 15, padding: "13px 28px" }}>
              Request Access <ArrowRight size={16} />
            </button>
          </Link>
          <Link href="/login">
            <button className="btn-secondary" style={{ fontSize: 15, padding: "13px 28px" }}>
              <Play size={16} />
              Browse Courses
            </button>
          </Link>
        </motion.div>
      </section>

      {/* Stats */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        style={{
          maxWidth: 800,
          margin: "0 auto 100px",
          padding: "0 24px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 16,
        }}
      >
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="card"
            style={{ padding: "24px", textAlign: "center" }}
          >
            <div
              style={{
                fontSize: 32,
                fontWeight: 800,
                fontFamily: "Poppins, sans-serif",
                color: "var(--gold)",
              }}
            >
              {s.value}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
              {s.label}
            </div>
          </motion.div>
        ))}
      </motion.section>

      {/* Features */}
      <section
        style={{ maxWidth: 1100, margin: "0 auto 100px", padding: "0 24px" }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ textAlign: "center", marginBottom: 52 }}
        >
          <h2
            style={{
              fontFamily: "Poppins, sans-serif",
              fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
              marginBottom: 12,
            }}
          >
            Built for serious learners
          </h2>
          <p style={{ color: "var(--text-secondary)", maxWidth: 480, margin: "0 auto" }}>
            Every detail of Luxaar is designed to help you learn faster, retain
            more, and actually finish what you start.
          </p>
        </motion.div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 20,
          }}
        >
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="card"
              style={{ padding: "28px 24px" }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "rgba(201,168,76,0.1)",
                  border: "1px solid rgba(201,168,76,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                <f.icon size={20} color="#c9a84c" />
              </div>
              <h3
                style={{
                  fontWeight: 600,
                  fontSize: 16,
                  color: "var(--text-primary)",
                  marginBottom: 8,
                }}
              >
                {f.title}
              </h3>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Checklist section */}
      <section
        style={{ maxWidth: 1100, margin: "0 auto 100px", padding: "0 24px" }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 48,
            alignItems: "center",
          }}
        >
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2
              style={{
                fontFamily: "Poppins, sans-serif",
                fontSize: "clamp(1.75rem, 3vw, 2.25rem)",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                marginBottom: 20,
              }}
            >
              Everything you need
              <br />
              <span className="gradient-text">nothing you don&apos;t</span>
            </h2>
            <p style={{ color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 28 }}>
              We stripped out platform bloat and left only what makes you learn
              better. Every feature exists for a reason.
            </p>
            <Link href="/signup">
              <button className="btn-primary">
                Get Started <ArrowRight size={16} />
              </button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            style={{ display: "flex", flexDirection: "column", gap: 14 }}
          >
            {[
              "Role-based access: Admin & Student",
              "Video embed from Google Drive & GitHub",
              "Markdown notes with download resources",
              "Progress tracking & completion certificates",
              "Admin dashboard with analytics",
              "Dark & light mode with system sync",
              "PWA-ready for mobile install",
              "Secure JWT authentication",
            ].map((item, i) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                style={{ display: "flex", alignItems: "center", gap: 12 }}
              >
                <CheckCircle size={18} color="#c9a84c" />
                <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>{item}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section
        style={{ maxWidth: 1100, margin: "0 auto 100px", padding: "0 24px" }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ textAlign: "center", marginBottom: 48 }}
        >
          <h2
            style={{
              fontFamily: "Poppins, sans-serif",
              fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              marginBottom: 12,
            }}
          >
            Trusted by learners worldwide
          </h2>
        </motion.div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 20,
          }}
        >
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="card"
              style={{ padding: "28px 24px" }}
            >
              <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
                {Array.from({ length: t.rating }).map((_, si) => (
                  <Star key={si} size={14} color="#c9a84c" fill="#c9a84c" />
                ))}
              </div>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 20 }}>
                &ldquo;{t.text}&rdquo;
              </p>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>
                  {t.name}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{t.role}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "0 24px 100px" }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="card"
          style={{
            maxWidth: 700,
            margin: "0 auto",
            padding: "60px 40px",
            textAlign: "center",
            background:
              "linear-gradient(135deg, rgba(201,168,76,0.06) 0%, transparent 100%)",
            border: "1px solid rgba(201,168,76,0.15)",
          }}
        >
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 16,
              background: "linear-gradient(135deg, #c9a84c, #a07830)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
            }}
          >
            <Award size={28} color="#0a0a0a" />
          </div>
          <h2
            style={{
              fontFamily: "Poppins, sans-serif",
              fontSize: "clamp(1.5rem, 3vw, 2rem)",
              fontWeight: 700,
              marginBottom: 12,
              letterSpacing: "-0.02em",
            }}
          >
            Ready to elevate your skills?
          </h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: 32, lineHeight: 1.7 }}>
            Join Luxaar today. Request access and start your premium learning
            journey within 24 hours.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/signup">
              <button className="btn-primary" style={{ fontSize: 15, padding: "13px 28px" }}>
                <Users size={16} />
                Request Access
              </button>
            </Link>
            <Link href="/login">
              <button className="btn-secondary" style={{ fontSize: 15, padding: "13px 28px" }}>
                I have an account
              </button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid var(--border)",
          padding: "32px 24px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            marginBottom: 12,
          }}
        >
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 7,
              background: "linear-gradient(135deg, #c9a84c, #a07830)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <BookOpen size={13} color="#0a0a0a" />
          </div>
          <span style={{ fontWeight: 700, fontFamily: "Poppins" }}>Luxaar</span>
        </div>
        <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
          © {new Date().getFullYear()} Luxaar. All rights reserved. Private
          platform — access by invitation only.
        </p>
      </footer>
    </div>
  );
}
