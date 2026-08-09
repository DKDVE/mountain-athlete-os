import { useCallback, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  AthleteProfile,
  hasScreeningFlags,
  programGenerationBlocked,
  type AthleteProfile as AthleteProfileType,
} from '@maos/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { NumberStepper } from '@/components/ui/number-stepper';
import { useAuthStore } from '@/stores/auth-store';
import { supabase } from '@/lib/supabase';
import {
  EMPTY_DRAFT,
  generateProgramForUser,
  parseProfileWithAi,
  saveAthleteProfile,
  saveAthleteProfileDraft,
  type OnboardingDraft,
} from '@/features/onboarding/onboarding-api';
import { useAthleteProfile } from '@/features/onboarding/onboarding-queries';

const GOAL_OPTIONS: { value: AthleteProfileType['goals'][number]; label: string }[] = [
  { value: 'hybrid_performance', label: 'Hybrid performance' },
  { value: 'strength', label: 'Strength' },
  { value: 'endurance', label: 'Endurance' },
  { value: 'fat_loss', label: 'Fat loss' },
  { value: 'recomposition', label: 'Recomposition' },
  { value: 'hypertrophy', label: 'Hypertrophy' },
  { value: 'event_specific', label: 'Event specific' },
  { value: 'longevity', label: 'Longevity' },
  { value: 'mobility_pain', label: 'Mobility / pain' },
  { value: 'glp1_preservation', label: 'GLP-1 preservation' },
];

const EXPERIENCE_OPTIONS: { value: AthleteProfileType['experience']; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'returning', label: 'Returning' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

const EQUIPMENT_OPTIONS: { value: AthleteProfileType['constraints']['equipment'][number]; label: string }[] = [
  { value: 'barbell', label: 'Barbell' },
  { value: 'dumbbell', label: 'Dumbbell' },
  { value: 'rack', label: 'Rack' },
  { value: 'bench', label: 'Bench' },
  { value: 'pull_up_bar', label: 'Pull-up bar' },
  { value: 'cable', label: 'Cable' },
  { value: 'machine', label: 'Machine' },
  { value: 'band', label: 'Band' },
  { value: 'bodyweight', label: 'Bodyweight' },
  { value: 'outdoor', label: 'Outdoor' },
];

const SCREENING_OPTIONS: { flag: AthleteProfileType['screening']['flags'][number]['flag']; label: string; needsRegion?: boolean }[] = [
  { flag: 'cardiac', label: 'Heart condition' },
  { flag: 'metabolic', label: 'Metabolic condition' },
  { flag: 'renal', label: 'Kidney condition' },
  { flag: 'pregnancy', label: 'Pregnant' },
  { flag: 'current_injury', label: 'Current injury', needsRegion: true },
  { flag: 'recent_surgery', label: 'Recent surgery' },
  { flag: 'uncontrolled_bp', label: 'Uncontrolled blood pressure' },
  { flag: 'chronic_condition_other', label: 'Other chronic condition' },
];

type Door = 'choose' | 'manual' | 'ai';
type Step = 'goals' | 'about' | 'experience' | 'constraints' | 'screening' | 'preferences' | 'gate' | 'reveal';

const MANUAL_STEPS: Step[] = ['goals', 'about', 'experience', 'constraints', 'screening', 'preferences', 'gate', 'reveal'];

function ProgressDots({ steps, current }: { steps: Step[]; current: Step }) {
  const idx = steps.indexOf(current);
  return (
    <div className="flex justify-center gap-2 py-4" data-testid="onboarding-progress">
      {steps.map((s, i) => (
        <span
          key={s}
          className={`h-2 w-2 rounded-full ${i <= idx ? 'bg-primary' : 'bg-muted'}`}
          aria-hidden
        />
      ))}
    </div>
  );
}

function toggleGoal(goals: AthleteProfileType['goals'], goal: AthleteProfileType['goals'][number]) {
  if (goals.includes(goal)) return goals.filter((g) => g !== goal);
  return [...goals, goal];
}

function goalRankLabel(goals: AthleteProfileType['goals'], goal: AthleteProfileType['goals'][number]): string {
  const idx = goals.indexOf(goal);
  return idx >= 0 ? `${String(idx + 1)}. ` : '';
}

function draftConstraints(draft: OnboardingDraft): NonNullable<OnboardingDraft['constraints']> {
  return draft.constraints ?? EMPTY_DRAFT.constraints ?? {
    daysPerWeek: 4,
    sessionMinutes: 60,
    equipment: [],
  };
}

function draftPreferences(draft: OnboardingDraft): NonNullable<OnboardingDraft['preferences']> {
  return draft.preferences ?? EMPTY_DRAFT.preferences ?? {
    likedMovements: [],
    dislikedMovements: [],
  };
}

function toggleEquipment(list: AthleteProfileType['constraints']['equipment'], item: (typeof list)[number]) {
  if (list.includes(item)) return list.filter((e) => e !== item);
  return [...list, item];
}

export function OnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const profileQuery = useAthleteProfile();
  const [door, setDoor] = useState<Door>('choose');
  const [step, setStep] = useState<Step>('goals');
  const [draft, setDraft] = useState<OnboardingDraft>(EMPTY_DRAFT);
  const [aiText, setAiText] = useState('');
  const [aiPreview, setAiPreview] = useState<AthleteProfileType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [specializedMessage, setSpecializedMessage] = useState<string | null>(null);
  const [version, setVersion] = useState(1);

  useEffect(() => {
    if (profileQuery.data?.profile) {
      setDraft(profileQuery.data.profile);
      setVersion(profileQuery.data.version);
    } else if (profileQuery.data === null && profileQuery.isSuccess) {
      setDraft(EMPTY_DRAFT);
    }
  }, [profileQuery.data, profileQuery.isSuccess]);

  const persistDraft = useCallback(
    async (next: OnboardingDraft) => {
      if (!user) return;
      await saveAthleteProfileDraft(user.id, next, version);
    },
    [user, version],
  );

  const updateDraft = (patch: Partial<OnboardingDraft>) => {
    setDraft((prev) => {
      const next = { ...prev, ...patch };
      void persistDraft(next);
      return next;
    });
  };

  const goNext = () => {
    const idx = MANUAL_STEPS.indexOf(step);
    const next = MANUAL_STEPS[idx + 1];
    if (idx < MANUAL_STEPS.length - 1 && next) setStep(next);
  };

  const goBack = () => {
    const idx = MANUAL_STEPS.indexOf(step);
    const prev = MANUAL_STEPS[idx - 1];
    if (idx > 0 && prev) setStep(prev);
    else if (door === 'manual') setDoor('choose');
  };

  const buildProfile = (): AthleteProfileType => AthleteProfile.parse(draft);

  const finishOnboarding = async () => {
    if (!user) return;
    setPending(true);
    setError(null);
    try {
      const profile = buildProfile();
      await saveAthleteProfile(user.id, profile, version);
      const outcome = await generateProgramForUser(user.id, profile);
      if (outcome.status === 'specialized') {
        setSpecializedMessage(outcome.message);
        setStep('reveal');
      } else {
        await queryClient.invalidateQueries({ queryKey: ['athlete_profile'] });
        await queryClient.invalidateQueries({ queryKey: ['program'] });
        await queryClient.invalidateQueries({ queryKey: ['sessions'] });
        void navigate('/', { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create program');
    } finally {
      setPending(false);
    }
  };

  const onAiParse = async () => {
    if (!user) return;
    setPending(true);
    setError(null);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) throw new Error('Not authenticated');
      const result = await parseProfileWithAi(aiText, token);
      if (!result.ok) {
        setDoor('manual');
        setError(`AI unavailable — continuing manually. ${result.message}`);
        return;
      }
      setAiPreview(result.profile);
      setDraft(result.profile);
      await persistDraft(result.profile);
    } catch (err) {
      setDoor('manual');
      setError(err instanceof Error ? err.message : 'AI parse failed');
    } finally {
      setPending(false);
    }
  };

  if (!user) return null;

  if (door === 'choose') {
    return (
      <div className="mx-auto flex min-h-[80vh] max-w-lg flex-col justify-center px-4 py-8">
        <h1 className="font-display text-2xl font-semibold">Welcome to MAOS</h1>
        <p className="mt-2 text-muted-foreground">How would you like to set up your athlete profile?</p>
        <div className="mt-8 space-y-4">
          <Button
            className="h-14 w-full text-base"
            data-testid="onboarding-door-manual"
            onClick={() => {
              setDoor('manual');
              setStep('goals');
            }}
          >
            Step through questions
          </Button>
          <Button
            variant="outline"
            className="h-14 w-full text-base"
            data-testid="onboarding-door-ai"
            onClick={() => {
              setDoor('ai');
            }}
          >
            Tell the coach about yourself
          </Button>
        </div>
      </div>
    );
  }

  if (door === 'ai' && !aiPreview) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8">
        <h1 className="font-display text-xl font-semibold">Tell the coach about yourself</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Goals, experience, schedule, injuries, equipment — write naturally.
        </p>
        <textarea
          className="mt-4 min-h-[200px] w-full rounded-md border border-border bg-background p-4 text-base"
          data-testid="onboarding-ai-text"
          value={aiText}
          onChange={(e) => {
            setAiText(e.target.value);
          }}
          placeholder="I want to get stronger for a trek in 12 weeks. I train 4 days, have a barbell and can run outdoors. No major injuries."
        />
        {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
        <div className="mt-6 flex gap-3">
          <Button variant="outline" className="h-12 min-w-[44px] flex-1" onClick={() => { setDoor('choose'); }}>
            Back
          </Button>
          <Button
            className="h-12 min-w-[44px] flex-1"
            data-testid="onboarding-ai-submit"
            disabled={pending || aiText.length < 10}
            onClick={() => void onAiParse()}
          >
            {pending ? 'Parsing…' : 'Parse profile'}
          </Button>
        </div>
      </div>
    );
  }

  if (door === 'ai' && aiPreview) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8">
        <h1 className="font-display text-xl font-semibold">Review your profile</h1>
        <p className="mt-2 text-sm text-muted-foreground">Edit anything before confirming.</p>
        <Card className="mt-4">
          <CardContent className="space-y-2 pt-4 text-sm">
            <p><strong>Goals:</strong> {aiPreview.goals.join(', ')}</p>
            <p><strong>Experience:</strong> {aiPreview.experience}</p>
            <p><strong>Days/week:</strong> {aiPreview.constraints.daysPerWeek}</p>
            <p><strong>Screening:</strong> {aiPreview.screening.flags.length ? aiPreview.screening.flags.map((f) => f.flag).join(', ') : 'None'}</p>
          </CardContent>
        </Card>
        <div className="mt-6 flex gap-3">
          <Button variant="outline" className="h-12 flex-1" onClick={() => { setAiPreview(null); setDoor('manual'); setStep('goals'); }}>
            Edit manually
          </Button>
          <Button
            className="h-12 flex-1"
            data-testid="onboarding-ai-confirm"
            disabled={pending}
            onClick={() => void finishOnboarding()}
          >
            Confirm & build program
          </Button>
        </div>
      </div>
    );
  }

  const profilePreview = AthleteProfile.safeParse(draft);
  const blocked = profilePreview.success && programGenerationBlocked(profilePreview.data);
  const flagged = profilePreview.success && hasScreeningFlags(profilePreview.data);

  return (
    <div className="mx-auto max-w-lg px-4 py-6 pb-24">
      <ProgressDots steps={MANUAL_STEPS} current={step} />

      {step === 'goals' ? (
        <Card>
          <CardHeader>
            <CardTitle>Your mission</CardTitle>
            <p className="text-sm text-muted-foreground">Tap to rank goals — first selected is primary.</p>
          </CardHeader>
          <CardContent className="space-y-2">
            {GOAL_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                variant={(draft.goals ?? []).includes(opt.value) ? 'default' : 'outline'}
                className="h-12 w-full justify-start text-base"
                data-testid={`goal-${opt.value}`}
                onClick={() => { updateDraft({ goals: toggleGoal(draft.goals ?? [], opt.value) }); }}
              >
                {(draft.goals ?? []).includes(opt.value) ? goalRankLabel(draft.goals ?? [], opt.value) : ''}
                {opt.label}
              </Button>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {step === 'about' ? (
        <Card>
          <CardHeader><CardTitle>About you</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <label className="block text-sm">Height (cm)
              <Input type="number" className="mt-1 h-12" data-testid="metric-height" value={draft.metricsSnapshot?.heightCm ?? ''} onChange={(e) => { updateDraft({ metricsSnapshot: { ...draft.metricsSnapshot, heightCm: e.target.value ? Number(e.target.value) : null } }); }} />
            </label>
            <label className="block text-sm">Weight (kg)
              <Input type="number" className="mt-1 h-12" data-testid="metric-weight" value={draft.metricsSnapshot?.weightKg ?? ''} onChange={(e) => { updateDraft({ metricsSnapshot: { ...draft.metricsSnapshot, weightKg: e.target.value ? Number(e.target.value) : null } }); }} />
            </label>
            <label className="block text-sm">Waist (cm)
              <Input type="number" className="mt-1 h-12" value={draft.metricsSnapshot?.waistCm ?? ''} onChange={(e) => { updateDraft({ metricsSnapshot: { ...draft.metricsSnapshot, waistCm: e.target.value ? Number(e.target.value) : null } }); }} />
            </label>
          </CardContent>
        </Card>
      ) : null}

      {step === 'experience' ? (
        <Card>
          <CardHeader><CardTitle>Training experience</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {EXPERIENCE_OPTIONS.map((opt) => (
              <Button key={opt.value} variant={draft.experience === opt.value ? 'default' : 'outline'} className="h-12 w-full" data-testid={`exp-${opt.value}`} onClick={() => { updateDraft({ experience: opt.value }); }}>{opt.label}</Button>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {step === 'constraints' ? (
        <Card>
          <CardHeader><CardTitle>Training constraints</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm">Days per week</p>
              <NumberStepper className="mt-2" value={draftConstraints(draft).daysPerWeek} min={1} max={7} onChange={(v) => { updateDraft({ constraints: { ...draftConstraints(draft), daysPerWeek: v } }); }} />
            </div>
            <div>
              <p className="text-sm">Session length (minutes)</p>
              <NumberStepper className="mt-2" value={draftConstraints(draft).sessionMinutes} min={20} max={180} step={5} onChange={(v) => { updateDraft({ constraints: { ...draftConstraints(draft), sessionMinutes: v } }); }} />
            </div>
            <div>
              <p className="mb-2 text-sm">Equipment available</p>
              <div className="flex flex-wrap gap-2">
                {EQUIPMENT_OPTIONS.map((opt) => (
                  <Button key={opt.value} size="sm" variant={draftConstraints(draft).equipment.includes(opt.value) ? 'default' : 'outline'} className="h-11" onClick={() => { updateDraft({ constraints: { ...draftConstraints(draft), equipment: toggleEquipment(draftConstraints(draft).equipment, opt.value) } }); }}>{opt.label}</Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {step === 'screening' ? (
        <Card>
          <CardHeader>
            <CardTitle>Health screening (PAR-Q+)</CardTitle>
            <p className="text-sm text-muted-foreground">Check any that apply today.</p>
          </CardHeader>
          <CardContent className="space-y-2">
            {SCREENING_OPTIONS.map((opt) => {
              const active = (draft.screening?.flags ?? []).some((f) => f.flag === opt.flag);
              return (
                <div key={opt.flag}>
                  <Button
                    variant={active ? 'default' : 'outline'}
                    className="h-12 w-full justify-start"
                    data-testid={`screening-${opt.flag}`}
                    onClick={() => {
                      const flags = draft.screening?.flags ?? [];
                      if (active) {
                        updateDraft({ screening: { flags: flags.filter((f) => f.flag !== opt.flag) } });
                      } else {
                        updateDraft({ screening: { flags: [...flags, { flag: opt.flag, region: opt.needsRegion ? 'shoulder' : undefined }] } });
                      }
                    }}
                  >
                    {opt.label}
                  </Button>
                  {active && opt.needsRegion ? (
                    <Input className="mt-2 h-12" placeholder="Injury region (e.g. shoulder)" data-testid="injury-region" value={(draft.screening?.flags ?? []).find((f) => f.flag === 'current_injury')?.region ?? ''} onChange={(e) => {
                      const flags = (draft.screening?.flags ?? []).map((f) => f.flag === 'current_injury' ? { ...f, region: e.target.value } : f);
                      updateDraft({ screening: { flags } });
                    }} />
                  ) : null}
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : null}

      {step === 'preferences' ? (
        <Card>
          <CardHeader><CardTitle>Preferences</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <label className="block text-sm">Dietary pattern
              <Input className="mt-1 h-12" placeholder="e.g. high protein vegetarian" value={draftPreferences(draft).dietaryPattern ?? ''} onChange={(e) => { updateDraft({ preferences: { ...draftPreferences(draft), dietaryPattern: e.target.value || null } }); }} />
            </label>
            <label className="block text-sm">Wearable owned
              <Input className="mt-1 h-12" placeholder="e.g. Garmin, Apple Watch" value={draftPreferences(draft).wearableOwned ?? ''} onChange={(e) => { updateDraft({ preferences: { ...draftPreferences(draft), wearableOwned: e.target.value || null } }); }} />
            </label>
          </CardContent>
        </Card>
      ) : null}

      {step === 'gate' ? (
        <Card>
          <CardHeader><CardTitle>Before you start</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm">
            {flagged ? (
              <p className="rounded-lg border border-warning/30 bg-warning/10 p-4 text-warning" data-testid="medical-gate">
                This isn&apos;t medical advice. Consult a qualified professional before starting any exercise program.
              </p>
            ) : (
              <p className="text-muted-foreground">No screening flags — you&apos;re cleared to proceed.</p>
            )}
            {blocked ? (
              <p className="text-muted-foreground" data-testid="specialized-preview">
                Your profile requires specialized programming we don&apos;t auto-generate yet. You&apos;ll see guidance on the next screen.
              </p>
            ) : (
              <p>We&apos;ll build your 12-week program with Rebuild → Build → Perform mesocycles.</p>
            )}
          </CardContent>
        </Card>
      ) : null}

      {step === 'reveal' ? (
        <Card>
          <CardHeader><CardTitle>{specializedMessage || blocked ? 'Specialized programming' : 'Your program is ready'}</CardTitle></CardHeader>
          <CardContent>
            {specializedMessage || blocked ? (
              <p className="text-sm text-muted-foreground" data-testid="specialized-state">
                {specializedMessage ?? 'Specialized programming is not yet available for your profile. Please consult a qualified professional before starting training.'}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">Week 1 sessions are on your Today tab.</p>
            )}
            {(specializedMessage || blocked) ? (
              <Button className="mt-4 h-12 w-full" onClick={() => void navigate('/', { replace: true })}>Go to Today</Button>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}

      {step !== 'reveal' ? (
        <div className="fixed bottom-0 left-0 right-0 flex gap-3 border-t border-border bg-background p-4 md:static md:mt-6 md:border-0 md:p-0">
          <Button variant="outline" className="h-12 min-h-[44px] flex-1" onClick={goBack}>Back</Button>
          {step === 'gate' ? (
            <Button className="h-12 min-h-[44px] flex-1" data-testid="onboarding-finish" disabled={pending || !(draft.goals?.length)} onClick={() => void finishOnboarding()}>
              {pending ? 'Building…' : 'Build my program'}
            </Button>
          ) : (
            <Button className="h-12 min-h-[44px] flex-1" data-testid="onboarding-next" disabled={step === 'goals' && !(draft.goals?.length)} onClick={goNext}>Continue</Button>
          )}
        </div>
      ) : null}
    </div>
  );
}
