// Полноценный AI помощник в стиле Goal: Habits & Tasks
// Создает цели, закрывает выполненные, дает советы, умный диалог

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Brain,
  Sparkles,
  Mic,
  MicOff,
  Send,
  X,
  Minimize2,
  Maximize2,
  CheckCircle2,
  Target,
  Lightbulb,
  MessageSquare,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { spiritualPathAPI } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Goal } from "@/types/spiritual-path";
import { analyzeGoals, generateRecommendations } from "@/lib/goal-analyzer";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  actions?: Array<{
    label: string;
    action: () => void;
    type: "create_goal" | "complete_goal" | "advice";
  }>;
}

export const SmartAIAssistant = () => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Загружаем цели при открытии
  useEffect(() => {
    if (isOpen) {
      loadGoals();
    }
  }, [isOpen, loadGoals]);

  // Автоскролл к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Инициализация голосового ввода
  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "ru-RU";

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
        handleSendMessage(transcript);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
        toast({
          title: "Ошибка распознавания",
          description: "Не удалось распознать речь",
          variant: "destructive",
        });
      };
    }
  }, [toast]);

  const loadGoals = useCallback(async () => {
    try {
      const data = await spiritualPathAPI.getGoals("all");
      setGoals(data);
    } catch (error) {
      console.error("Error loading goals:", error);
    }
  }, []);

  const handleVoiceInput = () => {
    if (!recognitionRef.current) {
      toast({
        title: "Голосовой ввод недоступен",
        description: "Ваш браузер не поддерживает распознавание речи",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleSendMessage = useCallback(async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text) return;

    setInput("");
    setIsProcessing(true);

    // Добавляем сообщение пользователя
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Обрабатываем запрос AI
    try {
      const response = await processAIRequest(text);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.message,
        timestamp: new Date(),
        actions: response.actions,
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error processing AI request:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Извините, произошла ошибка. Попробуйте еще раз.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  }, [input, processAIRequest]);

  const processAIRequest = async (text: string): Promise<{ message: string; actions?: Message["actions"] }> => {
    const lowerText = text.toLowerCase();

    // Анализ намерений
    const wantsToCreateGoal = /создай|создать|добавь|добавить|хочу|нужно|нужен|цель|задача/i.test(text);
    const wantsToCompleteGoal = /выполн|заверш|закр|отмет|сделал|сделала/i.test(text);
    const wantsAdvice = /совет|рекоменд|подскаж|помог|что делать|как/i.test(text);
    const wantsToSeeGoals = /покаж|показать|список|цели|задачи/i.test(text);

    // Создание цели
    if (wantsToCreateGoal) {
      const goalData = extractGoalData(text);
      if (goalData) {
        return {
          message: `Отлично! Я создам цель "${goalData.title}". ${goalData.description ? `Описание: ${goalData.description}. ` : ""}Создать цель?`,
          actions: [
            {
              label: "Создать цель",
              action: () => createGoal(goalData),
              type: "create_goal",
            },
          ],
        };
      } else {
        return {
          message: "Я понял, что вы хотите создать цель. Уточните, пожалуйста:\n- Название цели\n- Категория (намаз, Коран, зикр и т.д.)\n- Целевое значение (например, 30 дней или 100 раз)",
        };
      }
    }

    // Завершение цели
    if (wantsToCompleteGoal) {
      const goalMatch = findGoalByName(text, goals);
      if (goalMatch) {
        return {
          message: `Нашел цель "${goalMatch.title}". Отметить как выполненную?`,
          actions: [
            {
              label: "Отметить выполненной",
              action: () => completeGoal(goalMatch.id),
              type: "complete_goal",
            },
          ],
        };
      } else {
        return {
          message: "Не могу найти цель для завершения. Уточните название цели или скажите \"покажи мои цели\".",
        };
      }
    }

    // Показать цели
    if (wantsToSeeGoals) {
      if (goals.length === 0) {
        return {
          message: "У вас пока нет целей. Хотите создать первую?",
        };
      }
      const activeGoals = goals.filter((g) => g.status === "active");
      const completedGoals = goals.filter((g) => g.status === "completed");
      let message = `У вас ${goals.length} ${goals.length === 1 ? "цель" : "целей"}:\n\n`;
      if (activeGoals.length > 0) {
        message += `Активные (${activeGoals.length}):\n`;
        activeGoals.slice(0, 5).forEach((g) => {
          const progress = g.target_value > 0 ? Math.round((g.current_value / g.target_value) * 100) : 0;
          message += `• ${g.title} - ${progress}%\n`;
        });
      }
      if (completedGoals.length > 0) {
        message += `\nВыполненные (${completedGoals.length}):\n`;
        completedGoals.slice(0, 3).forEach((g) => {
          message += `• ${g.title} ✓\n`;
        });
      }
      return { message };
    }

    // Советы
    if (wantsAdvice) {
      const stats = analyzeGoals(goals, []);
      const recommendations = generateRecommendations(stats);
      return {
        message: `Вот мои рекомендации:\n\n${recommendations.slice(0, 3).map((r, i) => `${i + 1}. ${r}`).join("\n")}\n\nХотите создать новую цель на основе этих советов?`,
        actions: [
          {
            label: "Создать цель",
            action: () => setIsOpen(true),
            type: "advice",
          },
        ],
      };
    }

    // Общий ответ
    return {
      message: `Я ваш AI-помощник! Я могу:\n\n✅ Создать цель (скажите "создай цель читать Коран каждый день")\n✅ Закрыть выполненную цель (скажите "заверши цель...")\n✅ Показать ваши цели (скажите "покажи мои цели")\n✅ Дать совет (скажите "дай совет")\n\nЧто вы хотите сделать?`,
    };
  };

  const extractGoalData = (text: string): { title: string; category: string; description?: string; target?: number } | null => {
    // Простой парсинг для демо
    const categoryMatch = text.match(/(намаз|коран|зикр|дуа|садака|знания|99 имен)/i);
    const numberMatch = text.match(/(\d+)/);
    const target = numberMatch ? parseInt(numberMatch[1]) : undefined;

    // Извлекаем название (все после "создай" или "добавь")
    const titleMatch = text.match(/(?:создай|создать|добавь|добавить)\s+(.+?)(?:\s+(?:на|за|в)|$)/i);
    const title = titleMatch ? titleMatch[1].trim() : text.replace(/(?:создай|создать|добавь|добавить)/i, "").trim();

    if (!title) return null;

    return {
      title: title.length > 50 ? title.substring(0, 50) : title,
      category: categoryMatch ? categoryMatch[1].toLowerCase() : "zikr",
      target,
    };
  }, []);

  const findGoalByName = useCallback((text: string, goalsList: Goal[]): Goal | null => {
    const words = text.toLowerCase().split(/\s+/);
    for (const goal of goalsList) {
      const goalWords = goal.title.toLowerCase().split(/\s+/);
      if (words.some((w) => goalWords.some((gw) => gw.includes(w) || w.includes(gw)))) {
        return goal;
      }
    }
    return null;
  }, []);

  const createGoal = useCallback(async (goalData: { title: string; category: string; description?: string; target?: number }) => {
    try {
      const categoryMap: Record<string, "prayer" | "quran" | "zikr" | "sadaqa" | "knowledge" | "names_of_allah"> = {
        намаз: "prayer",
        коран: "quran",
        зикр: "zikr",
        дуа: "zikr",
        садака: "sadaqa",
        знания: "knowledge",
        "99 имен": "names_of_allah",
      };

      const category = categoryMap[goalData.category] || "zikr";

      await spiritualPathAPI.createGoal({
        title: goalData.title,
        description: goalData.description,
        category,
        type: goalData.target ? "fixed_term" : "habit",
        target_value: goalData.target || 30,
        current_value: 0,
        metric: goalData.target ? "count" : "days",
        status: "active",
      });

      await loadGoals();
      toast({
        title: "Цель создана!",
        description: `Цель "${goalData.title}" успешно создана`,
      });

      // Добавляем сообщение об успехе
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: `Отлично! Цель "${goalData.title}" создана. Теперь вы можете отслеживать свой прогресс!`,
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error("Error creating goal:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать цель",
        variant: "destructive",
      });
    }
  }, [loadGoals, toast, setMessages]);

  const completeGoal = useCallback(async (goalId: string) => {
    try {
      await spiritualPathAPI.updateGoal(goalId, { status: "completed" });
      await loadGoals();
      toast({
        title: "Цель выполнена!",
        description: "Поздравляем с достижением!",
      });

      const goal = goals.find((g) => g.id === goalId);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: `Поздравляю! Цель "${goal?.title || ""}" отмечена как выполненная. Ма ша Аллах! 🎉`,
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error("Error completing goal:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось завершить цель",
        variant: "destructive",
      });
    }
  }, [loadGoals, toast, goals, setMessages]);

  // Плавающая кнопка
  if (!isOpen) {
    return (
      <div className="fixed bottom-24 right-4 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="rounded-full h-14 w-14 shadow-lg bg-gradient-to-br from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white animate-pulse hover:animate-none"
        >
          <Brain className="w-6 h-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-24 right-4 z-50 w-96 max-w-[calc(100vw-2rem)]">
      <Card className="shadow-2xl border-2 border-purple-200">
        <CardHeader className="pb-3 bg-gradient-to-r from-purple-50 to-blue-50 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500">
                <AvatarFallback className="text-white">
                  <Brain className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-base">AI-помощник</CardTitle>
                <p className="text-xs text-muted-foreground">Голосовой и текстовый</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {!isMinimized && (
          <>
            <CardContent className="p-0">
              {/* Чат */}
              <div className="h-96 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.length === 0 ? (
                  <div className="text-center py-8 space-y-2">
                    <Brain className="w-12 h-12 mx-auto text-purple-400" />
                    <p className="text-sm text-gray-600">Привет! Я ваш AI-помощник</p>
                    <p className="text-xs text-gray-500">Скажите или напишите, что вы хотите сделать</p>
                    <div className="mt-4 space-y-2">
                      {[
                        "Создай цель читать Коран каждый день",
                        "Покажи мои цели",
                        "Дай совет",
                      ].map((suggestion) => (
                        <Button
                          key={suggestion}
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => handleSendMessage(suggestion)}
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex gap-2",
                        msg.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      {msg.role === "assistant" && (
                        <Avatar className="w-6 h-6 bg-purple-500 flex-shrink-0">
                          <AvatarFallback className="text-white text-xs">
                            <Brain className="w-3 h-3" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className="flex flex-col gap-1 max-w-[80%]">
                        <div
                          className={cn(
                            "rounded-lg px-3 py-2 text-sm break-words",
                            msg.role === "user"
                              ? "bg-purple-500 text-white"
                              : "bg-white border border-gray-200 text-gray-900"
                          )}
                        >
                          {msg.content}
                        </div>
                        {msg.actions && msg.actions.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-1">
                            {msg.actions.map((action, idx) => (
                              <Button
                                key={idx}
                                variant="outline"
                                size="sm"
                                className="text-xs h-auto py-1"
                                onClick={action.action}
                              >
                                {action.type === "create_goal" && <Target className="w-3 h-3 mr-1" />}
                                {action.type === "complete_goal" && <CheckCircle2 className="w-3 h-3 mr-1" />}
                                {action.type === "advice" && <Lightbulb className="w-3 h-3 mr-1" />}
                                {action.label}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                      {msg.role === "user" && (
                        <Avatar className="w-6 h-6 bg-gray-400 flex-shrink-0">
                          <AvatarFallback className="text-white text-xs">Вы</AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))
                )}
                {isProcessing && (
                  <div className="flex gap-2 justify-start">
                    <Avatar className="w-6 h-6 bg-purple-500">
                      <AvatarFallback className="text-white text-xs">
                        <Brain className="w-3 h-3" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Ввод */}
              <div className="p-3 border-t bg-white">
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-9 w-9 flex-shrink-0",
                      isListening && "bg-red-500 text-white animate-pulse"
                    )}
                    onClick={handleVoiceInput}
                    title="Голосовой ввод"
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </Button>
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                    placeholder="Напишите или скажите..."
                    className="flex-1"
                  />
                  <Button
                    size="icon"
                    className="h-9 w-9 flex-shrink-0 bg-purple-500 hover:bg-purple-600"
                    onClick={() => handleSendMessage()}
                    disabled={!input.trim() || isProcessing}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
};

