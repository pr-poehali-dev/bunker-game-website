import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

interface Player {
  id: string;
  name: string;
  profession: string;
  age: number;
  health: string;
  hobby: string;
  phobia: string;
  trait: string;
  baggage: string;
  fact: string;
  voted?: boolean;
}

interface GameSession {
  id: string;
  name: string;
  players: Player[];
  maxPlayers: number;
  status: 'waiting' | 'playing' | 'voting';
}

const Index = () => {
  const [activeTab, setActiveTab] = useState('lobby');
  const [sessions, setSessions] = useState<GameSession[]>([
    {
      id: '1',
      name: 'Бункер №47',
      players: [],
      maxPlayers: 8,
      status: 'waiting'
    }
  ]);
  const [currentSession, setCurrentSession] = useState<GameSession | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [newSessionName, setNewSessionName] = useState('');
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [timeLeft, setTimeLeft] = useState(180);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const tickSoundRef = useRef<HTMLAudioElement | null>(null);
  const alarmSoundRef = useRef<HTMLAudioElement | null>(null);
  const voteSoundRef = useRef<HTMLAudioElement | null>(null);
  const successSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    tickSoundRef.current = new Audio('/sounds/timer-tick.mp3');
    alarmSoundRef.current = new Audio('/sounds/alarm.mp3');
    voteSoundRef.current = new Audio('/sounds/vote.mp3');
    successSoundRef.current = new Audio('/sounds/success.mp3');

    return () => {
      tickSoundRef.current = null;
      alarmSoundRef.current = null;
      voteSoundRef.current = null;
      successSoundRef.current = null;
    };
  }, []);

  const playSound = (soundRef: React.MutableRefObject<HTMLAudioElement | null>) => {
    if (soundEnabled && soundRef.current) {
      soundRef.current.currentTime = 0;
      soundRef.current.play().catch(() => {});
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsTimerActive(false);
            playSound(alarmSoundRef);
            toast.warning('Время вышло! Переходим к голосованию');
            return 0;
          }
          if (prev <= 10) {
            playSound(tickSoundRef);
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timeLeft, soundEnabled]);

  const generateRandomPlayer = (name: string): Player => {
    const professions = ['Врач', 'Инженер', 'Учитель', 'Программист', 'Механик', 'Биолог', 'Военный', 'Повар'];
    const healthStates = ['Здоров', 'Легкая травма', 'Хроническая болезнь', 'Аллергия'];
    const hobbies = ['Садоводство', 'Охота', 'Чтение', 'Спорт', 'Музыка', 'Кулинария'];
    const phobias = ['Темнота', 'Замкнутое пространство', 'Высота', 'Пауки', 'Вода'];
    const traits = ['Лидер', 'Эгоист', 'Альтруист', 'Трус', 'Храбрец', 'Умный'];
    const baggages = ['Рюкзак с едой', 'Аптечка', 'Оружие', 'Инструменты', 'Книги', 'Семена'];
    const facts = ['Был в армии', 'Знает 3 языка', 'Выжил в катастрофе', 'Имеет детей', 'Умеет выживать'];

    return {
      id: Math.random().toString(36).substr(2, 9),
      name,
      profession: professions[Math.floor(Math.random() * professions.length)],
      age: Math.floor(Math.random() * 50) + 18,
      health: healthStates[Math.floor(Math.random() * healthStates.length)],
      hobby: hobbies[Math.floor(Math.random() * hobbies.length)],
      phobia: phobias[Math.floor(Math.random() * phobias.length)],
      trait: traits[Math.floor(Math.random() * traits.length)],
      baggage: baggages[Math.floor(Math.random() * baggages.length)],
      fact: facts[Math.floor(Math.random() * facts.length)],
      voted: false
    };
  };

  const createSession = () => {
    if (!newSessionName.trim()) {
      toast.error('Введите название сессии');
      return;
    }
    const newSession: GameSession = {
      id: Math.random().toString(36).substr(2, 9),
      name: newSessionName,
      players: [],
      maxPlayers: 8,
      status: 'waiting'
    };
    setSessions([...sessions, newSession]);
    setNewSessionName('');
    toast.success('Сессия создана!');
  };

  const joinSession = (sessionId: string) => {
    if (!playerName.trim()) {
      toast.error('Введите имя игрока');
      return;
    }
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    if (session.players.length >= session.maxPlayers) {
      toast.error('Сессия полна');
      return;
    }

    const newPlayer = generateRandomPlayer(playerName);
    const updatedSession = {
      ...session,
      players: [...session.players, newPlayer]
    };
    
    playSound(successSoundRef);
    setSessions(sessions.map(s => s.id === sessionId ? updatedSession : s));
    setCurrentSession(updatedSession);
    setActiveTab('game');
    toast.success(`${playerName} присоединился к игре!`);
  };

  const startRound = () => {
    setTimeLeft(180);
    setIsTimerActive(true);
    playSound(successSoundRef);
    if (currentSession) {
      const updatedSession = { ...currentSession, status: 'playing' as const };
      setCurrentSession(updatedSession);
      setSessions(sessions.map(s => s.id === currentSession.id ? updatedSession : s));
    }
    toast.success('Раунд начался!');
  };

  const startVoting = () => {
    setIsTimerActive(false);
    playSound(voteSoundRef);
    if (currentSession) {
      const updatedSession = { ...currentSession, status: 'voting' as const };
      setCurrentSession(updatedSession);
      setSessions(sessions.map(s => s.id === currentSession.id ? updatedSession : s));
    }
    toast.info('Начинается голосование!');
  };

  const votePlayer = (playerId: string) => {
    if (!currentSession) return;
    
    playSound(voteSoundRef);
    const updatedPlayers = currentSession.players.map(p => 
      p.id === playerId ? { ...p, voted: !p.voted } : p
    );
    const updatedSession = { ...currentSession, players: updatedPlayers };
    setCurrentSession(updatedSession);
    setSessions(sessions.map(s => s.id === currentSession.id ? updatedSession : s));
    
    toast.success('Голос учтён');
  };

  const updatePlayer = (updatedPlayer: Player) => {
    if (!currentSession) return;
    
    const updatedPlayers = currentSession.players.map(p => 
      p.id === updatedPlayer.id ? updatedPlayer : p
    );
    const updatedSession = { ...currentSession, players: updatedPlayers };
    setCurrentSession(updatedSession);
    setSessions(sessions.map(s => s.id === currentSession.id ? updatedSession : s));
    setEditingPlayer(null);
    toast.success('Карточка обновлена');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8 animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Icon name="ShieldAlert" size={48} className="text-primary" />
            <h1 className="text-5xl md:text-6xl font-bold text-primary glow">БУНКЕР</h1>
          </div>
          <div className="flex items-center justify-center gap-3">
            <p className="text-muted-foreground text-lg">Выживет сильнейший</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="gap-2"
            >
              <Icon name={soundEnabled ? 'Volume2' : 'VolumeX'} size={20} />
              {soundEnabled ? 'Звук вкл' : 'Звук выкл'}
            </Button>
          </div>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
            <TabsTrigger value="lobby" className="gap-2">
              <Icon name="Users" size={18} />
              Лобби
            </TabsTrigger>
            <TabsTrigger value="game" disabled={!currentSession} className="gap-2">
              <Icon name="Gamepad2" size={18} />
              Игра
            </TabsTrigger>
          </TabsList>

          <TabsContent value="lobby" className="space-y-6 animate-fade-in">
            <Card className="glow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Plus" size={24} />
                  Создать сессию
                </CardTitle>
              </CardHeader>
              <CardContent className="flex gap-3">
                <Input
                  placeholder="Название бункера..."
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={createSession} className="gap-2">
                  <Icon name="Rocket" size={18} />
                  Создать
                </Button>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              {sessions.map((session) => (
                <Card key={session.id} className="hover-scale glow">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Icon name="Castle" size={20} />
                        {session.name}
                      </span>
                      <Badge variant={session.status === 'waiting' ? 'default' : 'secondary'}>
                        {session.status === 'waiting' ? 'Ожидание' : 'Играют'}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Icon name="Users" size={16} />
                        Игроки: {session.players.length}/{session.maxPlayers}
                      </span>
                      <Progress value={(session.players.length / session.maxPlayers) * 100} className="w-24" />
                    </div>
                    {session.status === 'waiting' && (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Ваше имя"
                          value={playerName}
                          onChange={(e) => setPlayerName(e.target.value)}
                          className="flex-1"
                        />
                        <Button onClick={() => joinSession(session.id)} className="gap-2">
                          <Icon name="LogIn" size={18} />
                          Войти
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="game" className="space-y-6 animate-fade-in">
            {currentSession && (
              <>
                <Card className="glow-red">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Icon name="Timer" size={24} />
                        Таймер раунда
                      </span>
                      <Badge variant={timeLeft < 30 ? 'destructive' : 'default'} className="text-2xl px-4 py-2">
                        {formatTime(timeLeft)}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Progress value={(timeLeft / 180) * 100} className="h-3" />
                    <div className="flex gap-3">
                      {!isTimerActive && currentSession.status === 'waiting' && (
                        <Button onClick={startRound} className="gap-2 flex-1">
                          <Icon name="Play" size={18} />
                          Начать раунд
                        </Button>
                      )}
                      {isTimerActive && (
                        <Button onClick={() => setIsTimerActive(false)} variant="destructive" className="gap-2 flex-1">
                          <Icon name="Pause" size={18} />
                          Пауза
                        </Button>
                      )}
                      {currentSession.status === 'playing' && (
                        <Button onClick={startVoting} variant="secondary" className="gap-2 flex-1">
                          <Icon name="Vote" size={18} />
                          Голосование
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {currentSession.players.map((player) => (
                    <Card key={player.id} className={`hover-scale ${player.voted ? 'border-destructive' : ''} glow`}>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <Icon name="User" size={20} />
                            {player.name}
                          </span>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="ghost" onClick={() => setEditingPlayer(player)}>
                                <Icon name="Edit" size={16} />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Редактировать карточку</DialogTitle>
                              </DialogHeader>
                              {editingPlayer && (
                                <div className="grid gap-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label>Имя</Label>
                                      <Input
                                        value={editingPlayer.name}
                                        onChange={(e) => setEditingPlayer({ ...editingPlayer, name: e.target.value })}
                                      />
                                    </div>
                                    <div>
                                      <Label>Возраст</Label>
                                      <Input
                                        type="number"
                                        value={editingPlayer.age}
                                        onChange={(e) => setEditingPlayer({ ...editingPlayer, age: parseInt(e.target.value) })}
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <Label>Профессия</Label>
                                    <Input
                                      value={editingPlayer.profession}
                                      onChange={(e) => setEditingPlayer({ ...editingPlayer, profession: e.target.value })}
                                    />
                                  </div>
                                  <div>
                                    <Label>Здоровье</Label>
                                    <Input
                                      value={editingPlayer.health}
                                      onChange={(e) => setEditingPlayer({ ...editingPlayer, health: e.target.value })}
                                    />
                                  </div>
                                  <div>
                                    <Label>Хобби</Label>
                                    <Input
                                      value={editingPlayer.hobby}
                                      onChange={(e) => setEditingPlayer({ ...editingPlayer, hobby: e.target.value })}
                                    />
                                  </div>
                                  <div>
                                    <Label>Фобия</Label>
                                    <Input
                                      value={editingPlayer.phobia}
                                      onChange={(e) => setEditingPlayer({ ...editingPlayer, phobia: e.target.value })}
                                    />
                                  </div>
                                  <div>
                                    <Label>Черта характера</Label>
                                    <Input
                                      value={editingPlayer.trait}
                                      onChange={(e) => setEditingPlayer({ ...editingPlayer, trait: e.target.value })}
                                    />
                                  </div>
                                  <div>
                                    <Label>Багаж</Label>
                                    <Input
                                      value={editingPlayer.baggage}
                                      onChange={(e) => setEditingPlayer({ ...editingPlayer, baggage: e.target.value })}
                                    />
                                  </div>
                                  <div>
                                    <Label>Доп. факт</Label>
                                    <Textarea
                                      value={editingPlayer.fact}
                                      onChange={(e) => setEditingPlayer({ ...editingPlayer, fact: e.target.value })}
                                    />
                                  </div>
                                  <Button onClick={() => updatePlayer(editingPlayer)} className="gap-2">
                                    <Icon name="Save" size={18} />
                                    Сохранить
                                  </Button>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Icon name="Briefcase" size={14} className="text-primary" />
                            <span className="text-muted-foreground">Профессия:</span>
                            <span className="font-medium">{player.profession}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Icon name="Calendar" size={14} className="text-primary" />
                            <span className="text-muted-foreground">Возраст:</span>
                            <span className="font-medium">{player.age} лет</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Icon name="Heart" size={14} className="text-primary" />
                            <span className="text-muted-foreground">Здоровье:</span>
                            <span className="font-medium">{player.health}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Icon name="Sparkles" size={14} className="text-primary" />
                            <span className="text-muted-foreground">Хобби:</span>
                            <span className="font-medium">{player.hobby}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Icon name="Skull" size={14} className="text-destructive" />
                            <span className="text-muted-foreground">Фобия:</span>
                            <span className="font-medium">{player.phobia}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Icon name="Award" size={14} className="text-primary" />
                            <span className="text-muted-foreground">Черта:</span>
                            <span className="font-medium">{player.trait}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Icon name="Package" size={14} className="text-primary" />
                            <span className="text-muted-foreground">Багаж:</span>
                            <span className="font-medium">{player.baggage}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <Icon name="Info" size={14} className="text-primary mt-0.5" />
                            <span className="text-muted-foreground">Факт:</span>
                            <span className="font-medium flex-1">{player.fact}</span>
                          </div>
                        </div>
                        {currentSession.status === 'voting' && (
                          <Button
                            onClick={() => votePlayer(player.id)}
                            variant={player.voted ? 'destructive' : 'secondary'}
                            className="w-full gap-2"
                          >
                            <Icon name={player.voted ? 'X' : 'Vote'} size={18} />
                            {player.voted ? 'Исключить' : 'Голосовать'}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;