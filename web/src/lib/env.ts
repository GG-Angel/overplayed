import z from "zod";

const createEnv = () => {
  const EnvSchema = z.object({
    API_BASE_URL: z.url(),
    CLOUDFLARE_SITE_KEY: z.string().min(1),
  });

  const envVars = Object.entries(import.meta.env).reduce<Record<string, string>>((acc, curr) => {
    const [key, value] = curr;
    if (key.startsWith("VITE_APP_")) {
      acc[key.replace("VITE_APP_", "")] = value;
    }
    return acc;
  }, {});

  const parsedEnv = EnvSchema.safeParse(envVars);

  if (!parsedEnv.success) {
    throw new Error(
      `Invalid env provided. The following variables are missing or invalid: ${Object.entries(
        z.treeifyError(parsedEnv.error).errors
      )
        .map(([k, v]) => `- ${k}: ${v}`)
        .join("\n")}`
    );
  }

  return parsedEnv.data;
};

export const env = createEnv();
