export type FormKind = "contact" | "newsletter";

export type Submission = {
  kind: FormKind;
  email: string;
  name?: string;
  phone?: string;
  company?: string;
  service?: string;
  consent?: boolean;
};

const services = new Set([
  "Website Design", "Digital Product Design", "Branding", "Design System",
  "Development", "Not sure yet", "Other",
]);

export function validateSubmission(kind: string, form: FormData): Submission {
  if (kind !== "contact" && kind !== "newsletter") throw new Error("Unknown form.");
  const value = (name: string) => String(form.get(name) ?? "").trim();
  const email = value("Email");
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Please enter a valid email address.");
  }
  if (kind === "newsletter") return { kind, email };
  const name = value("Name");
  const phone = value("Phone Number");
  const company = value("Company or Project Name");
  const service = value("Visa Type");
  if (!name || name.length > 200) throw new Error("Please enter your name.");
  if (!phone || phone.length > 80) throw new Error("Please enter your phone number.");
  if (company.length > 300) throw new Error("Company name is too long.");
  if (!services.has(service)) throw new Error("Please select a service.");
  if (!["on", "true", "yes"].includes(value("Privacy Policy"))) {
    throw new Error("Please agree to the Privacy Policy.");
  }
  return { kind, email, name, phone, company, service, consent: true };
}
