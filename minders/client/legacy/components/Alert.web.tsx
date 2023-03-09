export const StdAlert = (title, desc, onPress = () => {}) => {
  alert(`${title}\n${desc}`);
  if (onPress) onPress();
};

export const BinaryAlert = (
  title,
  desc,
  onPositivePress = () => {},
  onNegativePress = () => {}
) => {
  const descValue = desc ? `\n${desc}` : '';
  const res = window.confirm(`${title}${descValue}`);
  if (res) onPositivePress();
  else onNegativePress();
};
