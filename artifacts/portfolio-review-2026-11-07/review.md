# NPC Automators — portfolio suitability review

Date: 2026-11-07. Source: current local website at http://127.0.0.1:3000.

## Verdict

Personal portfolio use is feasible. The current positioning is a service agency. Subjective ratings: visual design 8/10; agency presentation 7/10; personal portfolio suitability as-is 5/10.

## Captured steps

### 1. Homepage and navigation

Strong visual first impression. Dark hero, purple texture and typography work together. The headline uses agency language and never identifies an individual. The plus-only navigation is less discoverable than visible Work / About / Contact links; its menu control was not exposed as a named button in the inspected accessibility tree.

![1. Homepage and navigation](/home/notrack/Desktop/website 2/artifacts/portfolio-review-2026-11-07/01-home-desktop.png)

![Opened navigation](/home/notrack/Desktop/website 2/artifacts/portfolio-review-2026-11-07/01b-navigation-desktop.png)

### 2. Project showcase

Attractive gallery, weak evidence for a portfolio. The inspected project section contains images but no links or buttons, project descriptions, personal responsibilities, or outcomes. Add three to five genuine projects with case studies and live/demo links.

![2. Project showcase](/home/notrack/Desktop/website 2/artifacts/portfolio-review-2026-11-07/02-projects-desktop.png)

### 3. About

Clean layout but impersonal. Agency process copy, a decorative flower and aggregate counts do not explain who the individual is or what they did. Replace with a short personal introduction, specialties, experience and relevant proof.

![3. About](/home/notrack/Desktop/website 2/artifacts/portfolio-review-2026-11-07/03-about-desktop.png)

### 4. Testimonials and footer

Polished cards with a 4.8 rating and 500+ reviews. Their authenticity was not verified. Use only genuine attributable reviews and supported numbers. Footer social links point to Framer, while the site is branded NPC Automators; the footer also exposes a 404 link. These need cleanup.

![4. Testimonials and footer](/home/notrack/Desktop/website 2/artifacts/portfolio-review-2026-11-07/04-testimonials-desktop.png)

![Footer](/home/notrack/Desktop/website 2/artifacts/portfolio-review-2026-11-07/04b-footer-desktop.png)

### 5. Contact

The Start a project link opens a structured, labelled form. Your global journey starts here is generic and mismatched to the offering. Contact destinations retain hello@mvnstudio.com and +1 (000) 123 4567. Use real contact details and a direct invitation. Submission and email delivery were not tested.

![5. Contact](/home/notrack/Desktop/website 2/artifacts/portfolio-review-2026-11-07/05-contact-desktop.png)

### 6. Mobile homepage

The 390 by 844 viewport check shows readable headline and visible CTAs, with no document horizontal overflow (client width and scroll width both 375 CSS pixels). There is generous empty space before the headline. This was a homepage check, not a complete mobile flow audit.

![6. Mobile homepage](/home/notrack/Desktop/website 2/artifacts/portfolio-review-2026-11-07/06-mobile-home.png)

## Recommended direction

Keep the visual style. Put your name and specific role in the hero, use a View my work primary CTA, move selected work near the top, explain your contribution and outcome for each project, add a personal About section, and replace template contact/social destinations. Keep testimonials and metrics only when genuine. A freelance portfolio can retain concise services and a project enquiry CTA; a job-focused portfolio benefits from resume and relevant professional links.

## Evidence limits

Visual and content review with a small navigation check. No production performance benchmark, form submission, delivery test, full keyboard flow, screen-reader run, or complete mobile audit. The plus-only menu merits accessible-name and keyboard verification. Small grey secondary text and animated content need contrast and reduced-motion checks before claiming accessibility conformance. No site source files were edited.
