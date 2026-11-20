import { Flex } from 'antd'
import { splitIntoCjkCharacters } from '@/lib/strokeOrder'
import { StrokeOrderDiagram } from './StrokeOrderDiagram'

/** One StrokeOrderDiagram per character of `word`, side by side, for a multi-character Chinese
 * word or Japanese word. Renders nothing if the word has no Han/kana characters to show. */
export function WordStrokeOrder({ word, languageCode }: { word: string; languageCode: string }) {
  const characters = splitIntoCjkCharacters(word)
  if (characters.length === 0) return null

  return (
    <Flex vertical align="center" gap={8} className="animate-fade-in">
      <Flex wrap align="flex-start" justify="center" gap={12}>
        {characters.map((character, index) => (
          // Words rarely repeat a character, but nothing prevents it (e.g. some Chinese words
          // like "谢谢") — index keeps each diagram distinct.
          <StrokeOrderDiagram
            key={`${character}-${index}`}
            character={character}
            languageCode={languageCode}
          />
        ))}
      </Flex>
      <p className="text-[10px] text-slate-400 dark:text-slate-500">
        Stroke data © AnimCJK, Arphic Public License
      </p>
    </Flex>
  )
}
