import { FC } from 'react';

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
}

const Logo: FC<LogoProps> = ({ className = '', width = 32, height = 32 }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
    >
      {/* Top-left segment - sky-700 */}
      <path d="M2 2H14V14H2V2Z" fill="#0369a1" />

      {/* Top-right segment - sky-500 */}
      <path d="M18 2H30V14H18V2Z" fill="#0ea5e9" />

      {/* Bottom-left segment - sky-400 */}
      <path d="M2 18H14V30H2V18Z" fill="#38bdf8" />

      {/* Bottom-right segment - sky-600 */}
      <path d="M18 18H30V30H18V18Z" fill="#0284c7" />
    </svg>
  );
};

export default Logo;
