# Prompt 22 — packages/ui (Shared UI Components)

> **Paste CLAUDE.md first, then this prompt.**
> **Prerequisite:** Step 01 complete (folder exists), Step 14 complete (shared types exist).
> **أضفه بعد الخطوة 14 — قبل بناء أي صفحة web.**

---

## Task

بناء `packages/ui` — مكتبة المكونات المشتركة بين `apps/web` و`apps/mobile`.

المكونات مقسومة لثلاث طبقات:
1. **Web-only** — React + Tailwind (Shadcn base)
2. **Mobile-only** — React Native + StyleSheet
3. **Logic-only** — hooks وutilities تعمل في البيئتين

---

## Structure

```
packages/ui/
  src/
    web/               ← Web-only components (Next.js / React)
      Button.tsx
      Input.tsx
      Card.tsx
      Badge.tsx
      Avatar.tsx
      Modal.tsx
      Toast.tsx
      Skeleton.tsx
      EmptyState.tsx
      StatCard.tsx
      ProgressBar.tsx
      MacroRing.tsx     ← SVG calorie/macro ring
      WorkoutCard.tsx   ← coach & trainee shared card
      MealCard.tsx
      index.ts
    mobile/            ← React Native components
      Button.tsx
      Input.tsx
      Card.tsx
      Badge.tsx
      Avatar.tsx
      Toast.tsx
      Skeleton.tsx
      EmptyState.tsx
      MacroRing.tsx     ← Expo SVG ring
      WorkoutCard.tsx
      SetRow.tsx        ← workout set logger row (mobile only)
      RestTimer.tsx     ← countdown with vibration (mobile only)
      index.ts
    hooks/             ← Platform-agnostic logic hooks
      useDebounce.ts
      useLocalStorage.ts
      useRestTimer.ts
      useSessionTimer.ts
      useWorkoutProgress.ts
      useMacroTotals.ts
      index.ts
  package.json
  tsconfig.json
```

---

## Web Components

### `web/Button.tsx`

```tsx
import { cn } from '../utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger' | 'teal'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: React.ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-[9px] font-semibold transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none font-[Tajawal,sans-serif]'

  const variants = {
    primary: 'bg-[#c8f135] text-[#0d0d12] hover:bg-[#d4ff40] active:scale-[0.98]',
    ghost:   'bg-transparent text-[#7878a0] border border-[rgba(255,255,255,0.10)] hover:bg-[#1c1c28] hover:text-[#e8e8f2]',
    danger:  'bg-[rgba(255,79,123,0.12)] text-[#ff4f7b] border border-[rgba(255,79,123,0.2)] hover:bg-[rgba(255,79,123,0.2)]',
    teal:    'bg-[rgba(45,232,200,0.12)] text-[#2de8c8] border border-[rgba(45,232,200,0.2)] hover:bg-[rgba(45,232,200,0.2)]',
  }

  const sizes = {
    sm: 'px-3 py-[5px] text-[12px]',
    md: 'px-4 py-2 text-[13px]',
    lg: 'px-6 py-3 text-[15px]',
  }

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Spinner /> : icon}
      {children}
    </button>
  )
}
```

### `web/Input.tsx`

```tsx
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export function Input({ label, error, hint, className, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[11.5px] font-medium text-[#7878a0]">{label}</label>
      )}
      <input
        className={cn(
          'w-full bg-[#1a1a26] border border-[rgba(255,255,255,0.10)] rounded-[9px]',
          'px-3 py-[10px] text-[13.5px] text-[#e8e8f2] font-[Tajawal,sans-serif]',
          'outline-none transition-colors placeholder:text-[#4a4a6a]',
          'focus:border-[#c8f135]',
          error && 'border-[#ff4f7b] focus:border-[#ff4f7b]',
          className
        )}
        {...props}
      />
      {error && <p className="text-[11px] text-[#ff4f7b]">{error}</p>}
      {hint && !error && <p className="text-[11px] text-[#4a4a6a]">{hint}</p>}
    </div>
  )
}
```

### `web/Badge.tsx`

```tsx
type BadgeVariant = 'lime' | 'teal' | 'rose' | 'amber' | 'sky' | 'violet' | 'gray'

const BADGE_STYLES: Record<BadgeVariant, string> = {
  lime:   'bg-[rgba(200,241,53,0.10)] text-[#c8f135] border-[rgba(200,241,53,0.18)]',
  teal:   'bg-[rgba(45,232,200,0.10)] text-[#2de8c8] border-[rgba(45,232,200,0.2)]',
  rose:   'bg-[rgba(255,79,123,0.10)] text-[#ff4f7b] border-[rgba(255,79,123,0.2)]',
  amber:  'bg-[rgba(255,176,64,0.10)] text-[#ffb040] border-[rgba(255,176,64,0.2)]',
  sky:    'bg-[rgba(77,184,255,0.10)] text-[#4db8ff] border-[rgba(77,184,255,0.2)]',
  violet: 'bg-[rgba(155,125,255,0.10)] text-[#9b7dff] border-[rgba(155,125,255,0.2)]',
  gray:   'bg-[rgba(255,255,255,0.06)] text-[#7878a0] border-[rgba(255,255,255,0.10)]',
}

export function Badge({ variant = 'gray', children }: { variant?: BadgeVariant; children: React.ReactNode }) {
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border',
      BADGE_STYLES[variant]
    )}>
      {children}
    </span>
  )
}
```

### `web/MacroRing.tsx`

```tsx
interface MacroRingProps {
  value: number         // current amount
  target: number        // target amount
  color: string         // CSS color
  label: string         // "بروتين"
  unit?: string         // "g" or "kcal"
  size?: number         // SVG size px, default 64
}

export function MacroRing({ value, target, color, label, unit = 'g', size = 64 }: MacroRingProps) {
  const r = (size / 2) - 6
  const circumference = 2 * Math.PI * r
  const pct = Math.min(value / target, 1)
  const offset = circumference * (1 - pct)

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx={size/2} cy={size/2} r={r}
            fill="none" stroke="var(--color-ink4,#222232)" strokeWidth={5}
          />
          <circle
            cx={size/2} cy={size/2} r={r}
            fill="none" stroke={color} strokeWidth={5}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[11px] font-bold font-[Syne,sans-serif]" style={{ color }}>
            {value}
          </span>
        </div>
      </div>
      <span className="text-[10px] text-[#4a4a6a] uppercase tracking-wide">{label}</span>
      <span className="text-[11px] font-semibold">{target}{unit}</span>
    </div>
  )
}
```

### `web/Skeleton.tsx`

```tsx
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn(
      'bg-[#1a1a26] rounded-[9px] animate-pulse',
      className
    )} />
  )
}

// Usage patterns:
export function SkeletonCard() {
  return (
    <div className="bg-[#13131c] border border-[rgba(255,255,255,0.06)] rounded-[14px] p-5">
      <Skeleton className="h-4 w-32 mb-4" />
      <Skeleton className="h-8 w-20 mb-2" />
      <Skeleton className="h-3 w-24" />
    </div>
  )
}

export function SkeletonTableRow() {
  return (
    <tr>
      <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
      <td className="px-4 py-3"><Skeleton className="h-5 w-16 rounded-full" /></td>
      <td className="px-4 py-3"><Skeleton className="h-2 w-20 rounded-full" /></td>
      <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
    </tr>
  )
}
```

### `web/EmptyState.tsx`

```tsx
interface EmptyStateProps {
  icon?: string          // emoji
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
}

export function EmptyState({ icon = '📭', title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-3">
      <span className="text-5xl">{icon}</span>
      <h3 className="text-[15px] font-semibold text-[#b0b0c8]">{title}</h3>
      {description && <p className="text-[13px] text-[#4a4a6a] max-w-xs leading-relaxed">{description}</p>}
      {action && (
        <Button onClick={action.onClick} className="mt-2">{action.label}</Button>
      )}
    </div>
  )
}
```

---

## Shared Hooks

### `hooks/useRestTimer.ts`

```typescript
export function useRestTimer() {
  const [seconds, setSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout>()

  const start = useCallback((restSeconds: number) => {
    setSeconds(restSeconds)
    setIsRunning(true)
  }, [])

  const skip = useCallback(() => {
    clearInterval(intervalRef.current)
    setIsRunning(false)
    setSeconds(0)
  }, [])

  useEffect(() => {
    if (!isRunning) return
    intervalRef.current = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) {
          clearInterval(intervalRef.current)
          setIsRunning(false)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [isRunning])

  const formatted = `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`

  return { seconds, isRunning, formatted, start, skip }
}
```

### `hooks/useWorkoutProgress.ts`

```typescript
interface ExerciseSetState {
  exerciseId: string
  setNumber: number
  reps: number | null
  weight: number | null
  done: boolean
}

export function useWorkoutProgress(totalExercises: number) {
  const [sets, setSets] = useState<Record<string, ExerciseSetState[]>>({})
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set())

  const markSetDone = useCallback((exerciseId: string, setNumber: number) => {
    setSets(prev => {
      const exerciseSets = prev[exerciseId] ?? []
      const updated = exerciseSets.map(s =>
        s.setNumber === setNumber ? { ...s, done: true } : s
      )
      const allDone = updated.every(s => s.done)
      if (allDone) {
        setCompletedExercises(c => new Set([...c, exerciseId]))
      }
      return { ...prev, [exerciseId]: updated }
    })
  }, [])

  const progressPct = Math.round(completedExercises.size / totalExercises * 100)

  return { sets, completedExercises, progressPct, markSetDone, setSets }
}
```

### `hooks/useMacroTotals.ts`

```typescript
interface MacroLog {
  calories: number
  proteinG: number
  carbsG: number
  fatsG: number
}

export function useMacroTotals(logs: MacroLog[], targets: MacroLog) {
  return useMemo(() => {
    const consumed = logs.reduce(
      (acc, log) => ({
        calories: acc.calories + log.calories,
        proteinG: acc.proteinG + log.proteinG,
        carbsG: acc.carbsG + log.carbsG,
        fatsG: acc.fatsG + log.fatsG,
      }),
      { calories: 0, proteinG: 0, carbsG: 0, fatsG: 0 }
    )

    return {
      consumed,
      remaining: {
        calories: Math.max(0, targets.calories - consumed.calories),
        proteinG: Math.max(0, targets.proteinG - consumed.proteinG),
        carbsG: Math.max(0, targets.carbsG - consumed.carbsG),
        fatsG: Math.max(0, targets.fatsG - consumed.fatsG),
      },
      percentages: {
        calories: Math.min(100, Math.round(consumed.calories / targets.calories * 100)),
        proteinG: Math.min(100, Math.round(consumed.proteinG / targets.proteinG * 100)),
        carbsG: Math.min(100, Math.round(consumed.carbsG / targets.carbsG * 100)),
        fatsG: Math.min(100, Math.round(consumed.fatsG / targets.fatsG * 100)),
      },
    }
  }, [logs, targets])
}
```

---

## Mobile Components

### `mobile/SetRow.tsx`

```tsx
// The core interaction for workout logging on mobile
interface SetRowProps {
  setNumber: number
  defaultReps?: string
  onComplete: (reps: number, weight: number | null) => void
}

export function SetRow({ setNumber, defaultReps, onComplete }: SetRowProps) {
  const [reps, setReps] = useState(defaultReps ?? '')
  const [weight, setWeight] = useState('')
  const [done, setDone] = useState(false)

  const handleDone = () => {
    const repsNum = parseInt(reps)
    if (!repsNum || repsNum < 1) return
    setDone(true)
    onComplete(repsNum, weight ? parseFloat(weight) : null)
  }

  return (
    <View style={styles.row}>
      <Text style={styles.num}>{setNumber}</Text>
      <TextInput
        style={[styles.inp, done && styles.doneInp]}
        value={reps} onChangeText={setReps}
        keyboardType="number-pad" placeholder={defaultReps ?? 'تكرار'}
        editable={!done}
      />
      <TextInput
        style={[styles.inp, done && styles.doneInp]}
        value={weight} onChangeText={setWeight}
        keyboardType="decimal-pad" placeholder="وزن"
        editable={!done}
      />
      <TouchableOpacity
        style={[styles.tick, done && styles.tickDone]}
        onPress={handleDone}
        activeOpacity={0.7}
      >
        <Text style={{ color: done ? '#0d0d12' : '#7878a0', fontSize: 16 }}>✓</Text>
      </TouchableOpacity>
    </View>
  )
}
```

### `mobile/RestTimer.tsx`

```tsx
// Auto-starts when isRunning becomes true, vibrates on complete
import { Vibration } from 'react-native'
import { useRestTimer } from '../hooks/useRestTimer'

export function RestTimer({ seconds, onComplete }: { seconds: number; onComplete: () => void }) {
  const { formatted, isRunning, skip } = useRestTimer()

  useEffect(() => {
    if (seconds > 0) timer.start(seconds)
  }, [seconds])

  useEffect(() => {
    if (!isRunning && seconds > 0) {
      Vibration.vibrate(500)
      onComplete()
    }
  }, [isRunning])

  if (!isRunning) return null

  return (
    <View style={styles.container}>
      <Text style={styles.label}>⏱ وقت الراحة</Text>
      <Text style={styles.time}>{formatted}</Text>
      <TouchableOpacity onPress={skip} style={styles.skipBtn}>
        <Text style={styles.skipText}>تخطي</Text>
      </TouchableOpacity>
    </View>
  )
}
```

---

## Output Requirements

- `packages/ui` compiles with zero TypeScript errors
- `MacroRing` animates smoothly when value changes
- `Skeleton` components cover all loading states in coach + trainee dashboards
- `EmptyState` used consistently across all list pages
- `useRestTimer` hook works identically on web and mobile
- All web components use CSS variables (not hardcoded colors) where possible
