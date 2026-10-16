import React, { useState } from 'react';
import { Dialog, Surface, Card, Button, OutlinedButton, IconButton, OutlinedTextField, Slider, Icon, T, alpha } from '../m3.jsx';
import { limitProfileName, normalizeProfileName } from '../profileName.js';

export const AvatarEmojiList = ['🎓', '🚀', '💡', '🧠', '📚', '⭐', '🔥', '🎯', '🏆', '☕'];
export const ProfileColorList = ['#E04F36', '#E28743', '#F59E0B', '#10B981', '#0284C7', '#8B5CF6'];

/** Color.parseColor(hex) con respaldo a PomoPrimary si el valor no es válido (#RRGGBB o #AARRGGBB). */
function parseColor(hex) {
  if (typeof hex === 'string') {
    if (/^#[0-9a-fA-F]{6}$/.test(hex)) return hex;
    if (/^#[0-9a-fA-F]{8}$/.test(hex)) return `#${hex.slice(3)}${hex.slice(1, 3)}`;
  }
  return 'var(--pomo-primary)';
}

function EmojiChip({ emoji, isSelected, onSelect }) {
  return (
    <div
      className="m3-state"
      onClick={onSelect}
      style={{
        width: 44, height: 44, flex: 'none', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: isSelected ? 'var(--primary-container)' : 'var(--surface-variant)',
        boxShadow: isSelected ? 'inset 0 0 0 2px var(--pomo-primary)' : undefined,
        color: 'var(--on-surface)',
      }}
    >
      <T v="bodyLarge" size={22}>{emoji}</T>
    </div>
  );
}

export function UserManagementDialog({ users, activeUser, onSelectUser, onCreateUser, onDismiss }) {
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [selectedColor, setSelectedColor] = useState(ProfileColorList[0]);
  const [selectedEmoji, setSelectedEmoji] = useState(AvatarEmojiList[0]);
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(100);

  const nameBlank = newUserName.trim() === '';

  return (
    <Dialog onDismiss={onDismiss} fullWidth>
      {/* Surface 24dp, surface + tonalElevation 6dp (superposición de surfaceTint al 10.75 %) */}
      <Surface
        testId="user_management_dialog"
        radius={24}
        color="color-mix(in srgb, var(--surface-tint) 10.75%, var(--surface))"
        style={{ width: '100%', display: 'flex', maxHeight: '100%' }}
      >
        <div style={{ boxSizing: 'border-box', width: '100%', padding: 22, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flex: 'none' }}>
            <T v="titleLarge" w="bold" color="var(--on-surface)">{isCreatingNew ? 'Nuevo Perfil de Estudio' : 'Perfiles de Usuario'}</T>
            <IconButton onClick={onDismiss} label="Cerrar" style={{ color: 'var(--on-surface)' }}>
              <Icon name="Close" />
            </IconButton>
          </div>

          <div style={{ height: 14, flex: 'none' }} />

          {!isCreatingNew ? (
            <>
              <T v="bodyMedium" color="var(--on-surface-variant)" as="div">Selecciona el perfil para registrar tus sesiones y estadísticas:</T>

              <div style={{ height: 14, flex: 'none' }} />

              {users.map((user) => {
                const isSelected = user.id === activeUser?.id;
                return (
                  <Card
                    key={user.id}
                    testId={`user_item_${user.id}`}
                    color={isSelected ? alpha('var(--primary-container)', 0.4) : alpha('var(--surface-variant)', 0.4)}
                    border={isSelected ? '2px solid var(--pomo-primary)' : undefined}
                    onClick={() => {
                      onSelectUser(user);
                      onDismiss();
                    }}
                    style={{ width: '100%', margin: '4px 0', flex: 'none', boxSizing: 'border-box' }}
                  >
                    <div style={{ boxSizing: 'border-box', display: 'flex', width: '100%', padding: 12, alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
                        <div
                          style={{
                            width: 42, height: 42, flex: 'none', borderRadius: '50%', background: parseColor(user.colorHex),
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          <T v="bodyLarge" size={20} color="var(--on-surface)">{user.avatarEmoji}</T>
                        </div>

                        <div style={{ width: 12, flex: 'none' }} />

                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <T v="titleMedium" w="bold" color="var(--on-surface)" as="div">{user.name}</T>
                          <T v="bodySmall" color="var(--on-surface-variant)" as="div">{`Meta diaria: ${user.dailyGoalMinutes} min`}</T>
                        </div>
                      </div>

                      {isSelected && <Icon name="Check" tint="var(--pomo-primary)" label="Activo" />}
                    </div>
                  </Card>
                );
              })}

              <div style={{ height: 16, flex: 'none' }} />

              <Button testId="add_user_button" onClick={() => setIsCreatingNew(true)} radius={14} style={{ width: '100%', flex: 'none' }}>
                <Icon name="Add" />
                <div style={{ width: 8, flex: 'none' }} />
                <T v="labelLarge">Crear Nuevo Perfil</T>
              </Button>
            </>
          ) : (
            <>
              {/* Create User Form */}
              <div style={{ flex: 'none' }}>
                <OutlinedTextField
                  testId="new_user_name_input"
                  value={newUserName}
                  onChange={(name) => setNewUserName(limitProfileName(name))}
                  label="Nombre del estudiante o perfil"
                  placeholder="Ej. María, Juan, Posgrado..."
                  radius={14}
                />
              </div>

              <div style={{ height: 14, flex: 'none' }} />

              <T v="labelLarge" w="semibold" color="var(--on-surface)" as="div">Elige tu avatar emoji:</T>

              <div style={{ display: 'flex', width: '100%', padding: '8px 0', gap: 8, flex: 'none' }}>
                {AvatarEmojiList.slice(0, 5).map((emoji) => (
                  <EmojiChip key={emoji} emoji={emoji} isSelected={selectedEmoji === emoji} onSelect={() => setSelectedEmoji(emoji)} />
                ))}
              </div>
              <div style={{ display: 'flex', width: '100%', paddingBottom: 8, gap: 8, flex: 'none' }}>
                {AvatarEmojiList.slice(5).map((emoji) => (
                  <EmojiChip key={emoji} emoji={emoji} isSelected={selectedEmoji === emoji} onSelect={() => setSelectedEmoji(emoji)} />
                ))}
              </div>

              <div style={{ height: 10, flex: 'none' }} />

              <T v="labelLarge" w="semibold" color="var(--on-surface)" as="div">Color distintivo:</T>

              <div style={{ display: 'flex', width: '100%', padding: '8px 0', gap: 10, flex: 'none' }}>
                {ProfileColorList.map((hex) => (
                  <div
                    key={hex}
                    className="m3-state"
                    onClick={() => setSelectedColor(hex)}
                    style={{
                      width: 36, height: 36, flex: 'none', borderRadius: '50%', background: parseColor(hex), color: 'var(--on-surface)',
                      boxShadow: selectedColor === hex ? 'inset 0 0 0 3px var(--on-surface)' : undefined,
                    }}
                  />
                ))}
              </div>

              <div style={{ height: 12, flex: 'none' }} />

              <T v="labelLarge" w="semibold" color="var(--on-surface)" as="div">
                {`Meta diaria de estudio: ${(dailyGoalMinutes / 60).toFixed(1)} horas (${dailyGoalMinutes} min)`}
              </T>

              <Slider value={dailyGoalMinutes} onChange={(v) => setDailyGoalMinutes(Math.trunc(v))} min={30} max={300} steps={8} label="Meta diaria de estudio, en minutos" />

              <div style={{ height: 20, flex: 'none' }} />

              <div style={{ display: 'flex', gap: 10, width: '100%', flex: 'none' }}>
                <OutlinedButton onClick={() => setIsCreatingNew(false)} radius={14} style={{ flex: '1 1 0', minWidth: 0 }}>
                  <T v="labelLarge">Cancelar</T>
                </OutlinedButton>

                <Button
                  testId="confirm_create_user_button"
                  color={nameBlank ? alpha('var(--on-surface)', 0.12) : 'var(--pomo-primary)'}
                  contentColor={nameBlank ? alpha('var(--on-surface)', 0.38) : undefined}
                  radius={14}
                  disabled={nameBlank}
                  onClick={() => {
                    if (!nameBlank) {
                      onCreateUser(normalizeProfileName(newUserName), selectedColor, dailyGoalMinutes, selectedEmoji);
                      onDismiss();
                    }
                  }}
                  style={{ flex: '1 1 0', minWidth: 0, opacity: 1 }}
                >
                  <T v="labelLarge">Guardar</T>
                </Button>
              </div>
            </>
          )}
        </div>
      </Surface>
    </Dialog>
  );
}
