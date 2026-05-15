import { spawn } from "child_process";
import { existsSync } from "fs";
import path from "path";
import { NextResponse } from "next/server";

const AGENT_SCRIPTS: Record<number, string> = {
  1: "agents/seo/seo_strategist.py",
  2: "agents/seo/keyword_researcher.py",
  3: "agents/seo/content_optimiser.py",
  4: "agents/seo/technical_seo.py",
  5: "agents/seo/aeo_specialist.py",
  6: "agents/seo/geo_specialist.py",
  7: "agents/seo/link_building.py",
  8: "agents/seo/analytics_manager.py",
  9: "agents/seo/competitor_intel.py",
  10: "agents/seo/content_auditor.py",
  11: "agents/seo/schema_markup.py",
  12: "agents/seo/cro_specialist.py",
  13: "agents/leads/booking_abandonment.py",
  14: "agents/social/social_promotion.py",
  15: "agents/social/social_copywriter.py",
  16: "agents/social/scheduler.py",
  17: "agents/social/social_listening.py",
  18: "agents/social/ugc_testimonial.py",
  19: "agents/social/influencer_outreach.py",
  20: "agents/social/instagram_dm.py",
  21: "agents/leads/lead_scoring.py",
  22: "agents/leads/whatsapp_alerts.py",
  23: "agents/leads/upsell_crosssell.py",
  24: "agents/ops/meta_ads_intelligence.py",
  25: "agents/pricing/dynamic_pricing.py",
  26: "agents/pricing/revenue_forecast.py",
  27: "agents/main.py",
  28: "agents/ops/itinerary_builder.py",
  29: "agents/ops/vendor_monitor.py",
  30: "agents/ops/visa_advisory.py",
  31: "agents/ops/customer_experience.py",
  32: "agents/email/email_nurture.py",
  33: "agents/email/newsletter_curator.py",
  34: "agents/pr/pr_outreach.py",
  35: "agents/pr/review_reputation.py",
  36: "agents/pr/thought_leadership.py",
  37: "agents/research/trend_forecaster.py",
  38: "agents/research/customer_persona.py",
  39: "agents/research/compliance.py",
};

const DEPENDENCY_ERROR_PATTERNS = [
  "ModuleNotFoundError",
  "No module named",
  "ImportError",
  "DistributionNotFound",
];

type RunResult = {
  code: number | null;
  stdout: string;
  stderr: string;
};

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ agentNumber: string }> }
) {
  const { agentNumber } = await params;
  const number = Number(agentNumber);
  const script = AGENT_SCRIPTS[number];

  if (!Number.isInteger(number) || !script) {
    return NextResponse.json(
      { error: "Agent number must be one of 1-39" },
      { status: 404 }
    );
  }

  const root = findProjectRoot();
  const scriptPath = path.join(root, script);
  const venvPython = path.join(root, "agents", ".venv", "Scripts", "python.exe");
  const python = existsSync(venvPython) ? venvPython : "python";

  if (!existsSync(scriptPath)) {
    return NextResponse.json(
      { error: `Agent #${number} is unavailable because ${script} was not found.` },
      { status: 503 }
    );
  }

  try {
    const result = await runAgent({
      python,
      scriptPath,
      root,
    });
    const output = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();

    if (result.code === 0) {
      return NextResponse.json({
        success: true,
        agentNumber: number,
        output,
      });
    }

    const dependencyMissing = DEPENDENCY_ERROR_PATTERNS.some((pattern) =>
      output.includes(pattern)
    );

    return NextResponse.json(
      {
        error: dependencyMissing
          ? "Agent runtime dependencies are missing. Install agents/requirements.txt in the agent virtualenv, then try again."
          : `Agent #${number} exited with code ${result.code}.`,
        output,
      },
      { status: dependencyMissing ? 503 : 500 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not start Python";

    return NextResponse.json(
      {
        error:
          message.includes("ENOENT") || python === "python"
            ? "Python is not available on this server. Install Python or create agents/.venv, then try again."
            : message,
      },
      { status: 503 }
    );
  }
}

function findProjectRoot() {
  let current = process.cwd();

  for (let i = 0; i < 5; i += 1) {
    if (existsSync(path.join(current, "run-agent.bat")) && existsSync(path.join(current, "agents"))) {
      return current;
    }
    current = path.dirname(current);
  }

  return path.resolve(process.cwd(), "../..");
}

function runAgent({
  python,
  scriptPath,
  root,
}: {
  python: string;
  scriptPath: string;
  root: string;
}) {
  return new Promise<RunResult>((resolve, reject) => {
    const child = spawn(python, [scriptPath], {
      cwd: root,
      env: {
        ...process.env,
        PYTHONPATH: [path.join(root, "agents", "src"), path.join(root, "agents")].join(
          path.delimiter
        ),
      },
      windowsHide: true,
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      resolve({ code, stdout, stderr });
    });
  });
}
