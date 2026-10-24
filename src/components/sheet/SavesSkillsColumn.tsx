import { ABILITIES, ABILITY_LABELS, type Ability } from '../../model/character';
import { SKILLS, type SkillKey } from '../../model/skills';
import { mod, profBonus, proficiencyBonus, skillTotal } from '../../rules/derive';
import { useCharacter } from '../../store/useCharacter';
import { DerivedField } from '../ui/DerivedField';
import { Panel } from '../ui/StatBox';
import { TextArea } from '../ui/TextArea';
import { Toggle } from '../ui/Toggle';
import { cx, panel, panelTitle } from '../ui/styles';
import { ProficiencyDot } from './ProficiencyDot';

const PROF_MULT = { none: 0, proficient: 1, expertise: 2 } as const;

function Row({
  testId,
  label,
  abilityTag,
  children,
  dot,
}: {
  testId: string;
  label: string;
  abilityTag?: string;
  children: React.ReactNode;
  dot: React.ReactNode;
}) {
  return (
    <div data-testid={testId} className="flex items-center space-x-1.5 py-[1px] text-sm leading-tight">
      {dot}
      <span className="truncate">{label}</span>
      {abilityTag && <span className="text-[10px] uppercase text-zinc-400 dark:text-zinc-500">{abilityTag}</span>}
      <span className="!ml-auto">{children}</span>
    </div>
  );
}

const totalInput = 'w-9 px-0 text-right font-medium';

export function SavingThrows() {
  const { character, dispatch } = useCharacter();
  return (
    <Panel title="Saving throws">
      <div className="grid grid-cols-2 gap-x-3">
        {ABILITIES.map((a: Ability) => {
          const s = character.saves[a];
          const auto = mod(character, a) + (s.proficient ? profBonus(character) : 0);
          return (
            <Row
              key={a}
              testId={`save-row-${a}`}
              label={ABILITY_LABELS[a]}
              dot={
                <ProficiencyDot
                  label={`${ABILITY_LABELS[a]} save`}
                  allowExpertise={false}
                  value={s.proficient ? 'proficient' : 'none'}
                  onChange={(p) => dispatch({ type: 'patch', patch: { saves: { [a]: { proficient: p !== 'none' } } } })}
                />
              }
            >
              <DerivedField
                label={`${ABILITY_LABELS[a]} save total`}
                auto={auto}
                override={s.override}
                onOverride={(n) => dispatch({ type: 'patch', patch: { saves: { [a]: { override: n } } } })}
                inputClassName={totalInput}
              />
            </Row>
          );
        })}
      </div>
    </Panel>
  );
}

export function SkillList() {
  const { character, dispatch } = useCharacter();
  return (
    <Panel title="Skills" className="flex-1">
      <div className="grid grid-cols-2 gap-x-3">
        {SKILLS.map((s) => {
          const entry = character.skills[s.key];
          const auto = mod(character, s.ability) + profBonus(character) * PROF_MULT[entry.proficiency];
          return (
            <Row
              key={s.key}
              testId={`skill-row-${s.key}`}
              label={s.label}
              abilityTag={s.ability}
              dot={
                <ProficiencyDot
                  label={s.label}
                  value={entry.proficiency}
                  onChange={(proficiency) =>
                    dispatch({ type: 'patch', patch: { skills: { [s.key as SkillKey]: { proficiency } } } })
                  }
                />
              }
            >
              <DerivedField
                label={`${s.label} total`}
                auto={auto}
                override={entry.override}
                onOverride={(n) => dispatch({ type: 'patch', patch: { skills: { [s.key as SkillKey]: { override: n } } } })}
                inputClassName={totalInput}
              />
            </Row>
          );
        })}
      </div>
    </Panel>
  );
}

export function SavesSkillsColumn() {
  const { character, dispatch } = useCharacter();
  const autoPassive = 10 + skillTotal(character, 'perception');
  return (
    <div className="flex min-h-0 flex-col space-y-1.5">
      <div className="grid grid-cols-2 gap-1.5">
        <div className={cx(panel, 'flex items-center justify-between px-2 py-1.5')}>
          <span className={panelTitle}>Inspiration</span>
          <Toggle
            label="Inspiration"
            hideLabel
            checked={character.inspiration}
            onChange={(inspiration) => dispatch({ type: 'patch', patch: { inspiration } })}
          />
        </div>
        <div className={cx(panel, 'flex items-center justify-between px-2 py-1.5')}>
          <span className={panelTitle}>Proficiency bonus</span>
          <DerivedField
            label="Proficiency bonus"
            auto={proficiencyBonus(character.info.level)}
            override={character.proficiencyBonusOverride}
            onOverride={(n) => dispatch({ type: 'patch', patch: { proficiencyBonusOverride: n } })}
          />
        </div>
      </div>
      <SavingThrows />
      <SkillList />
      <div className={cx(panel, 'flex items-center justify-between px-2 py-1.5')}>
        <span className={panelTitle}>Passive perception</span>
        <DerivedField
          label="Passive perception"
          signed={false}
          auto={autoPassive}
          override={character.passivePerceptionOverride}
          onOverride={(n) => dispatch({ type: 'patch', patch: { passivePerceptionOverride: n } })}
          inputClassName="font-medium"
        />
      </div>
      <Panel title="Other proficiencies and languages" className="max-h-40">
        <TextArea
          aria-label="Other proficiencies and languages"
          value={character.otherProficiencies}
          onChange={(v) => dispatch({ type: 'patch', patch: { otherProficiencies: v } })}
          autoGrow={false}
          minRows={3}
          className="h-full min-h-0 flex-1 overflow-y-auto"
          placeholder={`Common, Elvish · light armor · prof. bonus +${profBonus(character)}`}
        />
      </Panel>
    </div>
  );
}
