import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import clsx from 'clsx'
import css from './Pill.module.css'

export interface PillProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
  className?: string | undefined
  children?: ReactNode
}

/**
 * Render a pill chip. Interactive when onClick is supplied (renders a button);
 * otherwise a static span.
 * @param props.active - selected/active visual state.
 * @returns pill element.
 */
export const Pill = forwardRef<HTMLElement, PillProps>(function Pill(
  { active = false, className, children, onClick, ...rest },
  ref
) {
  if (!onClick) {
    return (
      <span
        ref={ref as any}
        className={clsx(css.pill, active && css.active, className)}
      >
        {children}
      </span>
    )
  }
  return (
    <button
      ref={ref as any}
      type="button"
      className={clsx(css.pill, css.interactive, active && css.active, className)}
      onClick={onClick}
      {...rest}
    >
      {children}
    </button>
  )
})

