import { useEffect, useRef, useReducer } from 'react'

/* ------------------------------ types ----------------------------------- */

type State = {
  axis: 'x' | 'y'
  previousPosition: string
  offsetStart: string
  offsetEnd: string
  result: string
  finished: boolean
}

type ActionMap = {
  SET_AXIS: 'x' | 'y'
  SET_PREVIOUS_POSITION: string
  SET_OFFSET_START: string
  SET_OFFSET_END: string
  SET_RESULT: string
  SET_FINISHED: boolean

  INCREMENT_PREVIOUS_POSITION: number
  INCREMENT_OFFSET_START: number
  INCREMENT_OFFSET_END: number

  RESET: undefined
}

type Action = {
  [K in keyof ActionMap]: ActionMap[K] extends undefined
    ? { type: K }
    : { type: K; payload: ActionMap[K] }
}[keyof ActionMap]

/* --------------------------- constants ---------------------------------- */

const INCREMENT = 0.1
const GITHUB_URL = 'https://github.com/autocorrectguy'

/* ----------------------------- utils ------------------------------------ */

class NumberHandler {
  public static extractFirstWord = (text: string): string => {
    const word = text.trim().split(' ')[0]
    if (word.length === 0) return ''
    return /^-?\d*\.?\d*$/.test(word) ? word : ''
  }

  public static incrementIfValid = (text: string, delta: number): string => {
    if (text.length === 0) return `${delta}`
    const num = parseFloat(text) + delta
    return NumberHandler.isValidNumber(num)
      ? `${NumberHandler.precise(num)}`
      : '0'
  }

  public static precise = (num: number) => Math.round(num * 1e8) / 1e8

  private static isValidNumber = (num: number) => !isNaN(num) && isFinite(num)
}

/* ------------------------ state and reducer ----------------------------- */

const initialState: State = {
  axis: 'x',
  previousPosition: '',
  offsetStart: '',
  offsetEnd: '',
  result: '',
  finished: false,
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    /* setters ------------------------------------------------------------ */
    case 'SET_AXIS':
      return { ...state, axis: action.payload }
    case 'SET_PREVIOUS_POSITION':
      return { ...state, previousPosition: action.payload }
    case 'SET_OFFSET_START':
      return { ...state, offsetStart: action.payload }
    case 'SET_OFFSET_END':
      return { ...state, offsetEnd: action.payload }
    case 'SET_RESULT':
      return { ...state, result: action.payload }
    case 'SET_FINISHED':
      return { ...state, finished: action.payload }

    /* incremental edits -------------------------------------------------- */
    case 'INCREMENT_PREVIOUS_POSITION':
      return {
        ...state,
        previousPosition: NumberHandler.incrementIfValid(
          state.previousPosition,
          action.payload,
        ),
      }
    case 'INCREMENT_OFFSET_START':
      return {
        ...state,
        offsetStart: NumberHandler.incrementIfValid(
          state.offsetStart,
          action.payload,
        ),
      }
    case 'INCREMENT_OFFSET_END':
      return {
        ...state,
        offsetEnd: NumberHandler.incrementIfValid(
          state.offsetEnd,
          action.payload,
        ),
      }

    /* reset -------------------------------------------------------------- */
    case 'RESET':
      return initialState

    default:
      return state
  }
}

/* ------------------------------ App ------------------------------------- */

const App = () => {
  const firstInputRef = useRef<HTMLInputElement | null>(null)
  const [state, dispatch] = useReducer(reducer, initialState)

  const { axis, previousPosition, offsetStart, offsetEnd, result, finished } =
    state

  useEffect(() => {
    // focus first field on mount
    firstInputRef.current?.focus()
  }, [])

  /* ------------------------- handlers ---------------------------------- */

  const calculateCenter = () => {
    const o1 = Number(offsetStart)
    const o2 = Number(offsetEnd)
    const prev = Number(previousPosition)

    const shift = (o1 + o2) / 2 - o1
    const newPos = NumberHandler.precise(prev - shift).toString()

    navigator.clipboard.writeText(newPos)
    dispatch({ type: 'SET_RESULT', payload: newPos })
    dispatch({ type: 'SET_FINISHED', payload: true })
  }

  const openInNewTab = (
    e: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
    url: string,
  ) => {
    e.preventDefault()
    const win = window.open(url, '_blank')
    win?.focus()
  }

  /* ------------------------------ JSX ---------------------------------- */

  return (
    <div className='font-techmono relative w-[280px] border bg-[#2C2C2C] p-2 text-[#B1B1B1]'>
      {/* header --------------------------------------------------------- */}
      <div className='mb-2 flex flex-col bg-[#232123] p-1'>
        <h1 className='text-center text-2xl leading-5 text-[#e2b450] uppercase'>
          Center artwork tool
        </h1>
        <p className='text-center text-sm leading-5 text-neutral-600'>
          ::::: Developed by
          <a
            className='cursor-pointer hover:text-white'
            href={GITHUB_URL}
            title={GITHUB_URL}
            onMouseDown={e => openInNewTab(e, GITHUB_URL)}>
            &nbsp;Martin&nbsp;
          </a>
          :::::
        </p>
      </div>

      {/* table ---------------------------------------------------------- */}
      <div className='flex justify-center text-base'>
        <table className='border-separate border-spacing-x-1 border-spacing-y-2 border border-neutral-700 px-1'>
          <tbody>
            {/* axis select ------------------------------------------------ */}
            <tr>
              <td className='text-right'>Axis:</td>
              <td>
                <div className='flex w-full max-w-24'>
                  {(['x', 'y'] as const).map(a => (
                    <div
                      key={a}
                      onMouseDown={() =>
                        dispatch({ type: 'SET_AXIS', payload: a })
                      }
                      className={`${
                        axis === a
                          ? 'bg-[#232123]'
                          : 'bg-transparent duration-100 hover:bg-neutral-700'
                      } ${
                        a === 'x' ? 'mr-1' : ''
                      } w-full cursor-pointer text-center`}>
                      {a}
                    </div>
                  ))}
                </div>
              </td>
            </tr>

            {/* previous position ---------------------------------------- */}
            <Row
              label='Previous position:'
              inputRef={firstInputRef}
              value={previousPosition}
              onChange={val =>
                dispatch({ type: 'SET_PREVIOUS_POSITION', payload: val })
              }
              onInc={delta =>
                dispatch({
                  type: 'INCREMENT_PREVIOUS_POSITION',
                  payload: delta,
                })
              }
            />

            {/* offset start --------------------------------------------- */}
            <Row
              label={axis === 'x' ? 'Offset left:' : 'Offset top:'}
              value={offsetStart}
              onChange={val =>
                dispatch({ type: 'SET_OFFSET_START', payload: val })
              }
              onInc={delta =>
                dispatch({
                  type: 'INCREMENT_OFFSET_START',
                  payload: delta,
                })
              }
            />

            {/* offset end ----------------------------------------------- */}
            <Row
              label={axis === 'x' ? 'Offset right:' : 'Offset bottom:'}
              value={offsetEnd}
              onChange={val =>
                dispatch({ type: 'SET_OFFSET_END', payload: val })
              }
              onInc={delta =>
                dispatch({
                  type: 'INCREMENT_OFFSET_END',
                  payload: delta,
                })
              }
            />

            {/* result ---------------------------------------------------- */}
            {finished && state.result.length > 0 && (
              <tr>
                <td className='text-right'>Result:</td>
                <td className='flex w-full max-w-24 bg-[#232123]'>
                  <input
                    readOnly
                    value={result}
                    type='text'
                    className='w-full px-1 focus:outline-1 focus:outline-neutral-400'
                  />
                </td>
              </tr>
            )}

            {/* calculate button ----------------------------------------- */}
            <tr>
              <td colSpan={2}>
                <button
                  onClick={calculateCenter}
                  className='w-full cursor-pointer bg-[#232123] py-1 hover:brightness-150'>
                  Calculate
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* result overlay -------------------------------------------------- */}
      {finished && (
        <dialog
          className='fixed inset-0 z-50 flex h-screen w-screen items-center justify-center bg-black/50 text-base text-neutral-300 backdrop-blur-sm'
          onClick={() => dispatch({ type: 'SET_FINISHED', payload: false })}>
          <div onClick={e => e.stopPropagation()}>
            <div>
              <div className='text-center text-base'>New Offset:</div>
              <div className='py-2 text-center text-6xl text-white select-text'>
                {result}
              </div>
            </div>
            <div className='text-center text-sm text-neutral-500'>
              Copied to clipboard.
            </div>
            <div className='text-center text-base'>Happy printing!</div>
            <div className='mt-4 flex justify-between'>
              <button
                className='mr-0.5 w-full cursor-pointer bg-neutral-700 px-2 py-1 text-base hover:brightness-150'
                onClick={() =>
                  dispatch({ type: 'SET_FINISHED', payload: false })
                }>
                Continue
              </button>
              <button
                className='ml-0.5 w-full cursor-pointer px-2 py-1 text-base text-balance hover:brightness-150'
                onClick={() => dispatch({ type: 'RESET' })}>
                Reset
              </button>
            </div>
          </div>
        </dialog>
      )}
    </div>
  )
}

/* --------------------- reusable row with input field ------------------ */

type RowProps = {
  label: string
  value: string
  inputRef?: React.RefObject<HTMLInputElement | null>
  onChange: (value: string) => void
  onInc: (delta: number) => void
}

const Row = ({ label, value, inputRef, onChange, onInc }: RowProps) => (
  <tr>
    <td className='text-right text-base whitespace-nowrap'>{label}</td>
    <td className='flex w-full max-w-24 bg-[#232123]'>
      <input
        ref={inputRef}
        value={value}
        type='text'
        onChange={e => onChange(NumberHandler.extractFirstWord(e.target.value))}
        className='w-full px-1 focus:outline-1 focus:outline-neutral-400'
      />
      <div>
        {([INCREMENT, -INCREMENT] as const).map((d, i) => (
          <svg
            key={d}
            onMouseDown={() => onInc(d)}
            className='h-3 w-3 cursor-pointer stroke-current hover:bg-white/10'
            viewBox='4 4 16 16'
            xmlns='http://www.w3.org/2000/svg'>
            <path
              className='stroke-2'
              d={i === 0 ? 'M9 13L12 10L15 13' : 'M15 11L12 14L9 11'}
            />
          </svg>
        ))}
      </div>
    </td>
  </tr>
)

export default App
