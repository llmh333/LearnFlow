import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as aiApi from '@/api/ai'

export const aiTutorKeys = {
  conversations: ['ai', 'conversations'] as const,
  conversation: (id: number) => ['ai', 'conversations', id] as const,
}

export function useExplainGrammar() {
  return useMutation({
    mutationFn: ({ languageCode, question }: { languageCode: string; question: string }) =>
      aiApi.explainGrammar(languageCode, question),
  })
}

export function useCorrectSentence() {
  return useMutation({
    mutationFn: ({ languageCode, text }: { languageCode: string; text: string }) =>
      aiApi.correctSentence(languageCode, text),
  })
}

export function useConversationList() {
  return useQuery({ queryKey: aiTutorKeys.conversations, queryFn: aiApi.listConversations })
}

export function useConversation(id: number | undefined) {
  return useQuery({
    queryKey: aiTutorKeys.conversation(id ?? -1),
    queryFn: () => aiApi.fetchConversation(id as number),
    enabled: id !== undefined,
  })
}

export function useSendConversationMessage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      conversationId,
      languageCode,
      scenario,
      message,
    }: {
      conversationId: number | null
      languageCode: string
      scenario: string | null
      message: string
    }) => aiApi.sendConversationMessage(conversationId, languageCode, scenario, message),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: aiTutorKeys.conversations }),
  })
}

export function useEndConversation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: aiApi.endConversation,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: aiTutorKeys.conversations }),
  })
}
