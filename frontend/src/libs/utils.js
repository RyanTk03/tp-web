export function getInitials(name) {
  return name.trim().split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

export function getAvatarClass(name) {
  const i = (name.charCodeAt(0) + name.charCodeAt(name.length - 1)) % 6;
  return `um-avatar um-avatar-${i}`;
}