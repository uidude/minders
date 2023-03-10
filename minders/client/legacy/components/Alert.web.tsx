/**
 * @format
 */

export const StdAlert = (title: string, desc: string, onPress = () => {}) => {
  alert(`${title}\n${desc}`);
  if (onPress) onPress();
};

export const BinaryAlert = (
  title: string,
  desc: string,
  onPositivePress = () => {},
  onNegativePress = () => {},
) => {
  const descValue = desc ? `\n${desc}` : '';
  const res = window.confirm(`${title}${descValue}`);
  if (res) onPositivePress();
  else onNegativePress();
};
