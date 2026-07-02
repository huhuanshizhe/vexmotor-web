'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

import type { Locale } from '@/lib/i18n';
import { apiFetch } from '@/lib/api-client';
import { withLocalePath } from '@/lib/i18n';

type CustomDevelopmentFormProps = {
  intakeProductId: string;
  intakeProductName: string;
  locale: Locale;
  referenceSpu?: string;
  referenceProductName?: string;
};

type CustomBriefState = {
  application: string;
  dutyCycle: string;
  temperature: string;
  ipRating: string;
  vibration: string;
  altitude: string;
  requiredTorque: string;
  peakTorque: string;
  speedCurve: string;
  frameSize: string;
  shaft: string;
  mounting: string;
  supplyVoltage: string;
  currentLimit: string;
  driverPreference: string;
  communication: string;
  feedback: string;
  complianceNeeds: string;
  annualVolume: string;
  targetPrice: string;
  targetLeadTime: string;
  ndaRequired: boolean;
  fullName: string;
  email: string;
  company: string;
  country: string;
  phone: string;
  notes: string;
};

type SectionKey = 'application' | 'environment' | 'mechanical' | 'electrical' | 'files' | 'commercial' | 'contact';

const CUSTOM_BRIEF_STORAGE_KEY = 'vexmotor-custom-brief-draft';

const INITIAL_BRIEF: CustomBriefState = {
  application: '',
  dutyCycle: '',
  temperature: '',
  ipRating: '',
  vibration: '',
  altitude: '',
  requiredTorque: '',
  peakTorque: '',
  speedCurve: '',
  frameSize: '',
  shaft: '',
  mounting: '',
  supplyVoltage: '',
  currentLimit: '',
  driverPreference: '',
  communication: '',
  feedback: '',
  complianceNeeds: '',
  annualVolume: '',
  targetPrice: '',
  targetLeadTime: '',
  ndaRequired: false,
  fullName: '',
  email: '',
  company: '',
  country: '',
  phone: '',
  notes: '',
};

const DEFAULT_OPEN_SECTIONS: Record<SectionKey, boolean> = {
  application: true,
  environment: false,
  mechanical: false,
  electrical: false,
  files: false,
  commercial: false,
  contact: true,
};

function buildCustomBriefMessage(
  brief: CustomBriefState,
  projectFiles: string[],
  signedNdaFiles: string[],
  referenceProductName?: string,
  referenceSpu?: string,
) {
  const referenceSummary = [referenceProductName, referenceSpu ? `SPU ${referenceSpu}` : null].filter(Boolean).join(' · ');

  return [
    'CUSTOM DEVELOPMENT BRIEF',
    `Reference catalog product: ${referenceSummary || 'Not specified'}`,
    `Application: ${brief.application || 'Not specified'}`,
    `Duty cycle: ${brief.dutyCycle || 'Not specified'}`,
    '',
    'ENVIRONMENT',
    `Temperature: ${brief.temperature || 'Not specified'}`,
    `IP rating: ${brief.ipRating || 'Not specified'}`,
    `Vibration / shock: ${brief.vibration || 'Not specified'}`,
    `Altitude: ${brief.altitude || 'Not specified'}`,
    '',
    'MECHANICAL',
    `Required torque: ${brief.requiredTorque || 'Not specified'}`,
    `Peak torque: ${brief.peakTorque || 'Not specified'}`,
    `Torque / speed curve: ${brief.speedCurve || 'Not specified'}`,
    `Frame: ${brief.frameSize || 'Not specified'}`,
    `Shaft: ${brief.shaft || 'Not specified'}`,
    `Mounting: ${brief.mounting || 'Not specified'}`,
    '',
    'ELECTRICAL',
    `Supply voltage: ${brief.supplyVoltage || 'Not specified'}`,
    `Current limit: ${brief.currentLimit || 'Not specified'}`,
    `Driver preference: ${brief.driverPreference || 'Not specified'}`,
    `Communication: ${brief.communication || 'Not specified'}`,
    `Feedback: ${brief.feedback || 'Not specified'}`,
    '',
    'COMMERCIAL',
    `Compliance needs: ${brief.complianceNeeds || 'Not specified'}`,
    `Annual volume: ${brief.annualVolume || 'Not specified'}`,
    `Target price: ${brief.targetPrice || 'Not specified'}`,
    `Target lead time: ${brief.targetLeadTime || 'Not specified'}`,
    brief.ndaRequired ? 'NDA required: yes' : 'NDA required: no',
    '',
    'FILES',
    `Project files: ${projectFiles.length ? projectFiles.join(', ') : 'None listed'}`,
    `Signed NDA files: ${signedNdaFiles.length ? signedNdaFiles.join(', ') : 'None listed'}`,
    '',
    'CONTACT',
    `Full name: ${brief.fullName || 'Not specified'}`,
    `Email: ${brief.email || 'Not specified'}`,
    `Company: ${brief.company || 'Not specified'}`,
    `Country: ${brief.country || 'Not specified'}`,
    `Phone: ${brief.phone || 'Not specified'}`,
    `Additional notes: ${brief.notes || 'Not specified'}`,
  ].join('\n');
}

function UploadList({ files, emptyLabel }: { files: string[]; emptyLabel: string }) {
  if (!files.length) {
    return <p className="section-description compact-copy">{emptyLabel}</p>;
  }

  return (
    <div className="custom-upload-list">
      {files.map((file) => (
        <span key={file} className="custom-upload-pill">
          {file} · ready for intake
        </span>
      ))}
    </div>
  );
}

export function CustomDevelopmentForm({
  intakeProductId,
  intakeProductName,
  locale,
  referenceSpu,
  referenceProductName,
}: CustomDevelopmentFormProps) {
  const router = useRouter();
  const [brief, setBrief] = useState<CustomBriefState>(INITIAL_BRIEF);
  const [projectFiles, setProjectFiles] = useState<string[]>([]);
  const [signedNdaFiles, setSignedNdaFiles] = useState<string[]>([]);
  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>(DEFAULT_OPEN_SECTIONS);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const referenceSummary = [referenceProductName, referenceSpu ? `SPU ${referenceSpu}` : null].filter(Boolean).join(' · ');

  useEffect(() => {
    const stored = window.localStorage.getItem(CUSTOM_BRIEF_STORAGE_KEY);
    if (!stored) {
      return;
    }

    try {
      const parsed = JSON.parse(stored) as {
        brief?: CustomBriefState;
        projectFiles?: string[];
        signedNdaFiles?: string[];
      };

      if (parsed.brief) {
        setBrief(parsed.brief);
      }
      if (parsed.projectFiles?.length) {
        setProjectFiles(parsed.projectFiles);
      }
      if (parsed.signedNdaFiles?.length) {
        setSignedNdaFiles(parsed.signedNdaFiles);
      }
    } catch {
      window.localStorage.removeItem(CUSTOM_BRIEF_STORAGE_KEY);
    }
  }, []);

  function updateField<K extends keyof CustomBriefState>(key: K, value: CustomBriefState[K]) {
    setBrief((current) => ({ ...current, [key]: value }));
    setFeedback(null);
  }

  function toggleSection(section: SectionKey) {
    setOpenSections((current) => ({ ...current, [section]: !current[section] }));
  }

  function saveDraft(showFeedback = true) {
    window.localStorage.setItem(
      CUSTOM_BRIEF_STORAGE_KEY,
      JSON.stringify({
        brief,
        projectFiles,
        signedNdaFiles,
      }),
    );

    if (showFeedback) {
      setFeedback({ tone: 'success', text: 'Custom brief draft saved locally in this browser.' });
    }
  }

  function validateBeforeSubmit() {
    if (!brief.fullName.trim() || !brief.email.trim()) {
      return 'Contact name and email are required before submitting the custom brief.';
    }

    if (!brief.application.trim()) {
      return 'Application details are required before engineering review can start.';
    }

    return null;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      const validationError = validateBeforeSubmit();
      if (validationError) {
        setFeedback({ tone: 'error', text: validationError });
        return;
      }

      saveDraft(false);

      try {
        const created = await apiFetch<{ redirectPath?: string }>('/api/front/inquiries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: intakeProductId,
            fullName: brief.fullName,
            email: brief.email,
            phone: brief.phone,
            company: brief.company,
            country: brief.country,
            message: buildCustomBriefMessage(brief, projectFiles, signedNdaFiles, referenceProductName, referenceSpu),
          }),
        });

        const fallbackPath = withLocalePath('/contact', locale);
        const redirectPath = created.redirectPath ? `${created.redirectPath}?type=custom` : `${fallbackPath}?topic=custom-development`;

        window.localStorage.removeItem(CUSTOM_BRIEF_STORAGE_KEY);
        router.push(redirectPath);
        router.refresh();
      } catch (error) {
        setFeedback({ tone: 'error', text: error instanceof Error ? error.message : 'Unable to submit the custom brief right now.' });
      }
    });
  }

  return (
    <form className="custom-form-shell" onSubmit={handleSubmit}>
      <article className="info-card custom-toolbar" id="custom-brief">
        <div>
          <div className="card-kicker">Engineering intake</div>
          <h2 className="cart-section-title">Start specification</h2>
          <p className="section-description">The current workflow stores staged drafts locally, captures attachment names for engineering handoff, and submits the brief through the existing inquiry queue using {intakeProductName} as the intake anchor.</p>
          {referenceSummary ? (
            <div className="summary-stat">
              <span className="summary-label">Reference catalog product</span>
              <strong>{referenceSummary}</strong>
            </div>
          ) : null}
        </div>
        <div className="trade-empty-actions">
          <a href="/downloads/stepmotech-nda-template.txt" className="button-secondary" download>
            Download NDA template
          </a>
          <button type="button" className="button-secondary" onClick={() => saveDraft(true)}>
            Save draft
          </button>
        </div>
      </article>

      <div className="custom-section-stack">
        <article className="info-card custom-form-section">
          <button type="button" className="custom-section-toggle" onClick={() => toggleSection('application')} aria-expanded={openSections.application}>
            <div>
              <div className="card-kicker">Required</div>
              <h3 className="cart-section-title">Application & duty cycle</h3>
            </div>
            <span>{openSections.application ? 'Collapse' : 'Expand'}</span>
          </button>
          {openSections.application ? (
            <div className="custom-form-grid">
              <label className="form-field custom-field-span">
                <span>Application</span>
                <textarea className="form-input form-textarea" rows={5} value={brief.application} onChange={(event) => updateField('application', event.target.value)} placeholder="Describe the machine, axis, load profile, success target, and what is not working with off-the-shelf options." required />
              </label>
              <label className="form-field">
                <span>Duty cycle</span>
                <input className="form-input" value={brief.dutyCycle} onChange={(event) => updateField('dutyCycle', event.target.value)} placeholder="Intermittent, 24/7, short bursts, indexing..." />
              </label>
              <label className="form-field">
                <span>Target lead time</span>
                <input className="form-input" value={brief.targetLeadTime} onChange={(event) => updateField('targetLeadTime', event.target.value)} placeholder="Sample and MP expectation" />
              </label>
            </div>
          ) : null}
        </article>

        <article className="info-card custom-form-section">
          <button type="button" className="custom-section-toggle" onClick={() => toggleSection('environment')} aria-expanded={openSections.environment}>
            <div>
              <div className="card-kicker">Optional</div>
              <h3 className="cart-section-title">Environment</h3>
            </div>
            <span>{openSections.environment ? 'Collapse' : 'Expand'}</span>
          </button>
          {openSections.environment ? (
            <div className="custom-form-grid">
              <label className="form-field">
                <span>Temperature</span>
                <input className="form-input" value={brief.temperature} onChange={(event) => updateField('temperature', event.target.value)} placeholder="e.g. -20°C to +60°C" />
              </label>
              <label className="form-field">
                <span>IP rating</span>
                <input className="form-input" value={brief.ipRating} onChange={(event) => updateField('ipRating', event.target.value)} placeholder="IP40, IP54, IP65..." />
              </label>
              <label className="form-field">
                <span>Vibration / shock</span>
                <input className="form-input" value={brief.vibration} onChange={(event) => updateField('vibration', event.target.value)} placeholder="Shock, vibration, or transport exposure" />
              </label>
              <label className="form-field">
                <span>Altitude</span>
                <input className="form-input" value={brief.altitude} onChange={(event) => updateField('altitude', event.target.value)} placeholder="Sea level, high altitude, offshore..." />
              </label>
            </div>
          ) : null}
        </article>

        <article className="info-card custom-form-section">
          <button type="button" className="custom-section-toggle" onClick={() => toggleSection('mechanical')} aria-expanded={openSections.mechanical}>
            <div>
              <div className="card-kicker">Optional</div>
              <h3 className="cart-section-title">Mechanical</h3>
            </div>
            <span>{openSections.mechanical ? 'Collapse' : 'Expand'}</span>
          </button>
          {openSections.mechanical ? (
            <div className="custom-form-grid">
              <label className="form-field">
                <span>Required torque</span>
                <input className="form-input" value={brief.requiredTorque} onChange={(event) => updateField('requiredTorque', event.target.value)} placeholder="Holding / continuous torque target" />
              </label>
              <label className="form-field">
                <span>Peak torque</span>
                <input className="form-input" value={brief.peakTorque} onChange={(event) => updateField('peakTorque', event.target.value)} placeholder="Peak or overload requirement" />
              </label>
              <label className="form-field custom-field-span">
                <span>Torque / speed curve</span>
                <textarea className="form-input form-textarea" rows={4} value={brief.speedCurve} onChange={(event) => updateField('speedCurve', event.target.value)} placeholder="Describe the curve, inertia, acceleration, holding periods, or attach a named reference below." />
              </label>
              <label className="form-field">
                <span>Frame</span>
                <input className="form-input" value={brief.frameSize} onChange={(event) => updateField('frameSize', event.target.value)} placeholder="NEMA 17 / 23, 57 mm, custom envelope..." />
              </label>
              <label className="form-field">
                <span>Shaft</span>
                <input className="form-input" value={brief.shaft} onChange={(event) => updateField('shaft', event.target.value)} placeholder="Single shaft, dual shaft, gearbox output..." />
              </label>
              <label className="form-field">
                <span>Mounting</span>
                <input className="form-input" value={brief.mounting} onChange={(event) => updateField('mounting', event.target.value)} placeholder="NEMA flange, integrated housing, stage mount..." />
              </label>
            </div>
          ) : null}
        </article>

        <article className="info-card custom-form-section">
          <button type="button" className="custom-section-toggle" onClick={() => toggleSection('electrical')} aria-expanded={openSections.electrical}>
            <div>
              <div className="card-kicker">Optional</div>
              <h3 className="cart-section-title">Electrical & feedback</h3>
            </div>
            <span>{openSections.electrical ? 'Collapse' : 'Expand'}</span>
          </button>
          {openSections.electrical ? (
            <div className="custom-form-grid">
              <label className="form-field">
                <span>Supply voltage</span>
                <input className="form-input" value={brief.supplyVoltage} onChange={(event) => updateField('supplyVoltage', event.target.value)} placeholder="24V, 48V, AC input..." />
              </label>
              <label className="form-field">
                <span>Current limit</span>
                <input className="form-input" value={brief.currentLimit} onChange={(event) => updateField('currentLimit', event.target.value)} placeholder="Current per phase or driver limit" />
              </label>
              <label className="form-field">
                <span>Driver preference</span>
                <input className="form-input" value={brief.driverPreference} onChange={(event) => updateField('driverPreference', event.target.value)} placeholder="External driver, integrated, no preference..." />
              </label>
              <label className="form-field">
                <span>Communication</span>
                <input className="form-input" value={brief.communication} onChange={(event) => updateField('communication', event.target.value)} placeholder="STEP-DIR, EtherCAT, CANopen, Modbus..." />
              </label>
              <label className="form-field">
                <span>Feedback</span>
                <input className="form-input" value={brief.feedback} onChange={(event) => updateField('feedback', event.target.value)} placeholder="Open loop, encoder, resolver, hall..." />
              </label>
            </div>
          ) : null}
        </article>

        <article className="info-card custom-form-section">
          <button type="button" className="custom-section-toggle" onClick={() => toggleSection('files')} aria-expanded={openSections.files}>
            <div>
              <div className="card-kicker">Optional</div>
              <h3 className="cart-section-title">Files & NDA</h3>
            </div>
            <span>{openSections.files ? 'Collapse' : 'Expand'}</span>
          </button>
          {openSections.files ? (
            <div className="custom-section-stack compact-stack">
              <div className="custom-upload-card">
                <div>
                  <strong>Project files</strong>
                  <p className="section-description compact-copy">Add drawing, STEP, requirement docs, or a zipped spec pack. Current workflow records file names for engineering intake.</p>
                </div>
                <label className="button-secondary quote-file-button">
                  Add files
                  <input type="file" multiple onChange={(event) => setProjectFiles(Array.from(event.target.files ?? []).map((file) => file.name))} hidden />
                </label>
                <UploadList files={projectFiles} emptyLabel="No project files listed yet." />
              </div>

              <div className="custom-upload-card">
                <div>
                  <strong>Signed NDA</strong>
                  <p className="section-description compact-copy">Download the template above, complete it if your process requires NDA-first review, then attach the signed copy name here.</p>
                </div>
                <label className="button-secondary quote-file-button">
                  Upload signed NDA
                  <input type="file" multiple onChange={(event) => setSignedNdaFiles(Array.from(event.target.files ?? []).map((file) => file.name))} hidden />
                </label>
                <UploadList files={signedNdaFiles} emptyLabel="No signed NDA listed yet." />
              </div>
            </div>
          ) : null}
        </article>

        <article className="info-card custom-form-section">
          <button type="button" className="custom-section-toggle" onClick={() => toggleSection('commercial')} aria-expanded={openSections.commercial}>
            <div>
              <div className="card-kicker">Optional</div>
              <h3 className="cart-section-title">Commercial & compliance</h3>
            </div>
            <span>{openSections.commercial ? 'Collapse' : 'Expand'}</span>
          </button>
          {openSections.commercial ? (
            <div className="custom-form-grid">
              <label className="form-field custom-field-span">
                <span>Compliance requirements</span>
                <textarea className="form-input form-textarea" rows={4} value={brief.complianceNeeds} onChange={(event) => updateField('complianceNeeds', event.target.value)} placeholder="RoHS, REACH, CE file requests, test reports, traceability, export document needs..." />
              </label>
              <label className="form-field">
                <span>Annual volume</span>
                <input className="form-input" value={brief.annualVolume} onChange={(event) => updateField('annualVolume', event.target.value)} placeholder="Prototype, pilot, or yearly demand" />
              </label>
              <label className="form-field">
                <span>Target price</span>
                <input className="form-input" value={brief.targetPrice} onChange={(event) => updateField('targetPrice', event.target.value)} placeholder="Optional target cost" />
              </label>
              <label className="checkout-toggle-row custom-field-span">
                <input type="checkbox" checked={brief.ndaRequired} onChange={(event) => updateField('ndaRequired', event.target.checked)} />
                <span>NDA is required before drawings, test detail, or commercial review can proceed.</span>
              </label>
            </div>
          ) : null}
        </article>

        <article className="info-card custom-form-section">
          <button type="button" className="custom-section-toggle" onClick={() => toggleSection('contact')} aria-expanded={openSections.contact}>
            <div>
              <div className="card-kicker">Required</div>
              <h3 className="cart-section-title">Contact</h3>
            </div>
            <span>{openSections.contact ? 'Collapse' : 'Expand'}</span>
          </button>
          {openSections.contact ? (
            <div className="custom-form-grid">
              <label className="form-field">
                <span>Full name</span>
                <input className="form-input" value={brief.fullName} onChange={(event) => updateField('fullName', event.target.value)} placeholder="Engineering or sourcing owner" required />
              </label>
              <label className="form-field">
                <span>Email</span>
                <input className="form-input" type="email" value={brief.email} onChange={(event) => updateField('email', event.target.value)} placeholder="name@company.com" required />
              </label>
              <label className="form-field">
                <span>Company</span>
                <input className="form-input" value={brief.company} onChange={(event) => updateField('company', event.target.value)} placeholder="Company name" />
              </label>
              <label className="form-field">
                <span>Country</span>
                <input className="form-input" value={brief.country} onChange={(event) => updateField('country', event.target.value)} placeholder="Country / region" />
              </label>
              <label className="form-field">
                <span>Phone</span>
                <input className="form-input" value={brief.phone} onChange={(event) => updateField('phone', event.target.value)} placeholder="Optional" />
              </label>
              <label className="form-field custom-field-span">
                <span>Additional notes</span>
                <textarea className="form-input form-textarea" rows={4} value={brief.notes} onChange={(event) => updateField('notes', event.target.value)} placeholder="Commercial constraints, approval path, relevant links, or anything engineering should read first." />
              </label>
            </div>
          ) : null}
        </article>
      </div>

      <article className="info-card custom-submit-card">
        <div>
          <div className="card-kicker">Submit</div>
          <h2 className="cart-section-title">Send to engineering review</h2>
          <p className="section-description">Submission creates a tracked inquiry entry in the current storefront workflow. File names stay attached to the brief so the team can request the secure transfer step if needed.</p>
        </div>
        <div className="trade-empty-actions">
          <button type="button" className="button-secondary" onClick={() => saveDraft(true)}>
            Save draft
          </button>
          <button type="submit" className="button-primary" disabled={isPending}>
            {isPending ? 'Submitting...' : 'Submit custom brief'}
          </button>
        </div>
        {feedback ? <p className={`form-feedback form-feedback-${feedback.tone}`}>{feedback.text}</p> : null}
      </article>
    </form>
  );
}