import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { Sparkles, Send, RefreshCw, Loader2, MessageCircle, Heart, Droplets, Target, Dumbbell } from "lucide-react"
import { toast } from "sonner"
import { useState, useEffect, useRef } from "react"

interface Patient {
  id: string
  full_name: string
}

interface ChatMessage {
  id: string
  content: string
  role: "user" | "assistant"
  created_at: string
}

const coachingTopics = [
  "Weight Management",
  "Diabetes Diet",
  "Sleep Better",
  "Workout Plan",
  "Stress Relief"
]

export default function AIHealthCoaching() {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [message, setMessage] = useState("")
  const [showHistory, setShowHistory] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()

  const { data: patients } = useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("patients").select("id, full_name").order("full_name")
      if (error) throw error
      return data as Patient[]
    }
  })

  const { data: messages, refetch: refetchMessages } = useQuery({
    queryKey: ["health-coaching-messages", selectedPatient?.id],
    queryFn: async () => {
      if (!selectedPatient) return []
      const { data, error } = await supabase
        .from("health_coaching_messages")
        .select("*")
        .eq("patient_id", selectedPatient.id)
        .order("created_at", { ascending: true })
      if (error) throw error
      return data as ChatMessage[]
    },
    enabled: !!selectedPatient
  })

  useEffect(() => {
    if (patients && patients.length > 0 && !selectedPatient) {
      setSelectedPatient(patients[0])
    }
  }, [patients, selectedPatient])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const sendMessageMutation = useMutation({
    mutationFn: async (question: string) => {
      if (!selectedPatient) return

      const { error: userError } = await supabase.from("health_coaching_messages").insert({
        patient_id: selectedPatient.id,
        content: question,
        role: "user"
      })
      if (userError) throw userError

      const history = messages?.slice(-10).map(m => ({ role: m.role, content: m.content })) || []

      const { data, error } = await supabase.functions.invoke("ai-insights", {
        body: {
          mode: "chat",
          systemPrompt: "You are an empathetic AI Health Coach. Ground your advice in the patient's record, suggesting personalized wellness tips, diet suggestions, and exercises. Keep advice simple and India-specific (using Indian dietary terms if appropriate). Do not make clinical diagnoses; advise consulting their doctor for severe symptoms. Focus on lifestyle changes and wellness.",
          question,
          context: { patient: selectedPatient },
          history
        }
      })

      if (error) throw error

      const response = data?.answer || data?.response || "I'm sorry, I couldn't generate a response at this time."

      const { error: assistantError } = await supabase.from("health_coaching_messages").insert({
        patient_id: selectedPatient.id,
        content: response,
        role: "assistant"
      })
      if (assistantError) throw assistantError

      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health-coaching-messages", selectedPatient?.id] })
      setMessage("")
    },
    onError: (error: any) => {
      toast.error("Failed to send message: " + error.message)
    }
  })

  const resetConversationMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPatient) return
      const { error } = await supabase
        .from("health_coaching_messages")
        .delete()
        .eq("patient_id", selectedPatient.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health-coaching-messages", selectedPatient?.id] })
      toast.success("Conversation reset")
    }
  })

  const handleSend = () => {
    if (message.trim() && selectedPatient) {
      sendMessageMutation.mutate(message.trim())
    }
  }

  const handleTopicClick = (topic: string) => {
    setMessage(topic)
    if (selectedPatient) {
      sendMessageMutation.mutate(topic)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold gradient-text">AI Health Coaching</h1>
          <p className="text-muted-foreground">Personalized wellness guidance powered by AI</p>
        </div>
      </div>

      <div className="glass-card p-4">
        <select
          className="w-full md:w-auto px-4 py-2 rounded-lg border bg-background text-foreground"
          value={selectedPatient?.id || ""}
          onChange={(e) => {
            const patient = patients?.find(p => p.id === e.target.value)
            setSelectedPatient(patient || null)
          }}
        >
          <option value="">Select a patient</option>
          {patients?.map(patient => (
            <option key={patient.id} value={patient.id}>
              {patient.full_name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:hidden">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="btn-glossy px-4 py-2 rounded-lg w-full mb-2"
          >
            {showHistory ? "Hide" : "Show"} Conversation History
          </button>
        </div>

        <div className={`lg:col-span-1 ${showHistory ? "" : "hidden lg:block"}`}>
          <div className="glass-card p-4 h-[500px] overflow-y-auto scrollbar-thin">
            <h3 className="font-semibold mb-3">Conversation History</h3>
            {messages && messages.length > 0 ? (
              <div className="space-y-2">
                {messages
                  .filter(m => m.role === "user")
                  .slice(0, 10)
                  .map((msg, idx) => (
                    <div key={idx} className="p-2 rounded-lg bg-muted/50 text-sm">
                      <p className="font-medium truncate">{msg.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(msg.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No conversations yet</p>
            )}
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="glass-card h-[500px] flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
              {messages && messages.length > 0 ? (
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] p-3 rounded-lg ${
                          msg.role === "user"
                            ? "btn-glossy text-white"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(msg.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {sendMessageMutation.isPending && (
                    <div className="flex justify-start">
                      <div className="bg-muted p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Start the conversation by typing a message below</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t">
              <div className="flex flex-wrap gap-2 mb-3">
                {coachingTopics.map(topic => (
                  <button
                    key={topic}
                    onClick={() => handleTopicClick(topic)}
                    disabled={!selectedPatient || sendMessageMutation.isPending}
                    className="px-3 py-1 text-xs rounded-full border border-primary/20 hover:bg-primary/10 transition-colors disabled:opacity-50"
                  >
                    {topic}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your health question..."
                  disabled={!selectedPatient || sendMessageMutation.isPending}
                  className="flex-1 px-4 py-2 rounded-lg border bg-background text-foreground disabled:opacity-50"
                />
                <button
                  onClick={handleSend}
                  disabled={!message.trim() || !selectedPatient || sendMessageMutation.isPending}
                  className="btn-glossy p-2 rounded-lg disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
                <button
                  onClick={() => resetConversationMutation.mutate()}
                  disabled={!selectedPatient || resetConversationMutation.isPending}
                  className="p-2 rounded-lg border border-destructive text-destructive hover:bg-destructive/10 disabled:opacity-50"
                  title="Reset conversation"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}