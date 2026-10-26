import React, { useState, useEffect, useMemo } from 'react';
import { 
  Trophy, Users, Target, Swords, Settings, Plus, Trash2, Edit2, Download, 
  Search, Filter, Moon, Sun, Check, ArrowRight, RefreshCw, ChevronRight, 
  Award, Shield, UserPlus, Play, BarChart3, FileSpreadsheet, Printer
} from 'lucide-react';

// --- DEMO DATA ---
const INITIAL_COMPETITION = {
  name: "Championnat Régional Extérieur 2026",
  discipline: "TAE_NATIONAL", // TAE 50m / 70m
  targetDistance: "50m",
  endsPerSet: 6, // 6 volées par série
  arrowsPerEnd: 6, // 6 flèches par volée
  setsCount: 2, // 2 séries de 36 flèches (Total 72 flèches)
};

const INITIAL_ARCHERS = [
  { id: '1', name: 'DUPONT', firstName: 'Jean', club: 'Compagnie d\'Arc de Nîmes', category: 'Senior 1', bow: 'Classique', target: '01A', scores: {} },
  { id: '2', name: 'MARTIN', firstName: 'Sophie', club: 'Archers du Gard', category: 'Senior 1', bow: 'Classique', target: '01B', scores: {} },
  { id: '3', name: 'BERNARD', firstName: 'Lucas', club: 'Montpellier Archery', category: 'Senior 2', bow: 'Arc à poulies', target: '02A', scores: {} },
  { id: '4', name: 'PETIT', firstName: 'Camille', club: 'Compagnie d\'Arc de Nîmes', category: 'Senior 2', bow: 'Arc à poulies', target: '02B', scores: {} },
  { id: '5', name: 'ROBERT', firstName: 'Pierre', club: 'Archers Cévenols', category: 'Senior 1', bow: 'Arc Nu', target: '03A', scores: {} },
  { id: '6', name: 'RICHARD', firstName: 'Emmanuelle', club: 'Montpellier Archery', category: 'Senior 1', bow: 'Classique', target: '03B', scores: {} },
  { id: '7', name: 'DURAND', firstName: 'Thomas', club: 'Archers du Gard', category: 'Senior 2', bow: 'Classique', target: '04A', scores: {} },
  { id: '8', name: 'MOREAU', firstName: 'Chloé', club: 'Compagnie d\'Arc de Nîmes', category: 'U18', bow: 'Classique', target: '04B', scores: {} },
];

// Pré-remplissage de quelques scores pour tester les démos et classements instantanément
const generateDemoScores = (archers, comp) => {
  const values = ['X', '10', '9', '9', '8', '7', '10', '9', '8', '6'];
  return archers.map(archer => {
    const scores = {};
    for (let set = 1; set <= comp.setsCount; set++) {
      for (let end = 1; end <= comp.endsPerSet; end++) {
        const arrowKey = `s${set}_e${end}`;
        scores[arrowKey] = Array.from({ length: comp.arrowsPerEnd }, () => values[Math.floor(Math.random() * values.length)]);
      }
    }
    return { ...archer, scores };
  });
};

export default function ArcheryIanseoApp() {
  const [theme, setTheme] = useState('dark');
  const [activeTab, setActiveTab] = useState('scoring'); // 'scoring', 'leaderboard', 'brackets', 'archers', 'settings'
  const [competition, setCompetition] = useState(INITIAL_COMPETITION);
  const [archers, setArchers] = useState([]);
  
  // Scoring State
  const [selectedTarget, setSelectedTarget] = useState('01A');
  const [currentSet, setCurrentSet] = useState(1);
  const [currentEnd, setCurrentEnd] = useState(1);
  
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [bowFilter, setBowFilter] = useState('ALL');

  // Duels / Brackets state
  const [bracketCategory, setBracketCategory] = useState('Senior 1 - Classique');
  const [bracketsData, setBracketsData] = useState({});

  // Initialize Demo Data
  useEffect(() => {
    setArchers(generateDemoScores(INITIAL_ARCHERS, INITIAL_COMPETITION));
  }, []);

  // Theme Toggle
  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  // --- HELPER CALCULATIONS ---
  const calculateArcherStats = (archer) => {
    let totalScore = 0;
    let count10 = 0;
    let count9 = 0;
    let countX = 0;
    const setTotals = {};

    for (let s = 1; s <= competition.setsCount; s++) {
      setTotals[s] = 0;
    }

    Object.entries(archer.scores || {}).forEach(([key, arrows]) => {
      const setMatch = key.match(/^s(\d+)_/);
      const setNum = setMatch ? parseInt(setMatch[1]) : 1;

      arrows.forEach(val => {
        if (!val) return;
        if (val === 'X') {
          totalScore += 10;
          countX++;
          count10++;
          if (setTotals[setNum] !== undefined) setTotals[setNum] += 10;
        } else if (val === '10') {
          totalScore += 10;
          count10++;
          if (setTotals[setNum] !== undefined) setTotals[setNum] += 10;
        } else if (val === '9') {
          totalScore += 9;
          count9++;
          if (setTotals[setNum] !== undefined) setTotals[setNum] += 9;
        } else if (val === 'M') {
          // 0 point
        } else {
          const num = parseInt(val) || 0;
          totalScore += num;
          if (setTotals[setNum] !== undefined) setTotals[setNum] += num;
        }
      });
    });

    return { totalScore, count10, count9, countX, setTotals };
  };

  // Sort Archers for Live Leaderboard with Tie-break rules
  const rankedArchers = useMemo(() => {
    return [...archers].map(archer => {
      const stats = calculateArcherStats(archer);
      return { ...archer, stats };
    }).sort((a, b) => {
      if (b.stats.totalScore !== a.stats.totalScore) return b.stats.totalScore - a.stats.totalScore;
      if (b.stats.count10 !== a.stats.count10) return b.stats.count10 - a.stats.count10;
      return b.stats.count9 - a.stats.count9;
    });
  }, [archers, competition]);

  // Filtered Archers for Leaderboard display
  const filteredLeaderboard = useMemo(() => {
    return rankedArchers.filter(archer => {
      const matchesCat = categoryFilter === 'ALL' || archer.category === categoryFilter;
      const matchesBow = bowFilter === 'ALL' || archer.bow === bowFilter;
      const matchesSearch = searchQuery === '' || 
        archer.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        archer.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        archer.club.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCat && matchesBow && matchesSearch;
    });
  }, [rankedArchers, categoryFilter, bowFilter, searchQuery]);

  // Target List for Quick Switcher
  const targetsList = useMemo(() => {
    const list = archers.map(a => a.target).sort();
    return Array.from(new Set(list));
  }, [archers]);

  // Current Active Archer in Scoring Tab
  const currentArcher = useMemo(() => {
    return archers.find(a => a.target === selectedTarget) || archers[0];
  }, [archers, selectedTarget]);

  // Update Score handler
  const handleScoreInput = (value) => {
    if (!currentArcher) return;

    const arrowKey = `s${currentSet}_e${currentEnd}`;
    const currentEndScores = [...(currentArcher.scores[arrowKey] || [])];

    // If full, do nothing or overwrite
    if (currentEndScores.length < competition.arrowsPerEnd) {
      currentEndScores.push(value);
      
      setArchers(prev => prev.map(a => {
        if (a.id === currentArcher.id) {
          return {
            ...a,
            scores: {
              ...a.scores,
              [arrowKey]: currentEndScores
            }
          };
        }
        return a;
      }));
    }
  };

  // Backspace score handler
  const handleScoreBackspace = () => {
    if (!currentArcher) return;
    const arrowKey = `s${currentSet}_e${currentEnd}`;
    const currentEndScores = [...(currentArcher.scores[arrowKey] || [])];

    if (currentEndScores.length > 0) {
      currentEndScores.pop();
      setArchers(prev => prev.map(a => {
        if (a.id === currentArcher.id) {
          return {
            ...a,
            scores: {
              ...a.scores,
              [arrowKey]: currentEndScores
            }
          };
        }
        return a;
      }));
    }
  };

  // Add / Edit Archer Modal State
  const [isArcherModalOpen, setIsArcherModalOpen] = useState(false);
  const [editingArcher, setEditingArcher] = useState(null);
  const [archerForm, setArcherForm] = useState({
    name: '', firstName: '', club: '', category: 'Senior 1', bow: 'Classique', target: '01A'
  });

  const handleSaveArcher = (e) => {
    e.preventDefault();
    if (editingArcher) {
      setArchers(prev => prev.map(a => a.id === editingArcher.id ? { ...a, ...archerForm } : a));
    } else {
      const newArcher = {
        id: Date.now().toString(),
        ...archerForm,
        scores: {}
      };
      setArchers(prev => [...prev, newArcher]);
    }
    setIsArcherModalOpen(false);
    setEditingArcher(null);
    setArcherForm({ name: '', firstName: '', club: '', category: 'Senior 1', bow: 'Classique', target: '01A' });
  };

  const handleDeleteArcher = (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet archer ?")) {
      setArchers(prev => prev.filter(a => a.id !== id));
    }
  };

  // Render score badge styling
  const getScoreBadgeClass = (score) => {
    if (score === 'X' || score === '10') return 'bg-yellow-500 text-black font-extrabold shadow-sm';
    if (score === '9') return 'bg-yellow-400 text-black font-bold';
    if (score === '8' || score === '7') return 'bg-red-600 text-white font-bold';
    if (score === '6' || score === '5') return 'bg-blue-600 text-white font-bold';
    if (score === '4' || score === '3') return 'bg-neutral-800 text-white font-bold';
    if (score === '2' || score === '1') return 'bg-white text-black font-bold border border-gray-400';
    return 'bg-gray-300 text-gray-700 font-bold'; // M or 0
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* APP HEADER */}
      <header className={`px-4 py-3 border-b flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30 ${theme === 'dark' ? 'bg-slate-900/95 border-slate-800 backdrop-blur' : 'bg-white/95 border-slate-200 backdrop-blur shadow-sm'}`}>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-amber-500 to-red-600 rounded-xl text-white shadow-md">
            <Target className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
              ArcheryScores <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30">IANSEO Web</span>
            </h1>
            <p className="text-xs text-slate-400">{competition.name} • {competition.discipline}</p>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <nav className="flex items-center gap-1 overflow-x-auto py-1 px-1 rounded-xl bg-slate-800/40 p-1 border border-slate-700/50">
          <button 
            onClick={() => setActiveTab('scoring')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'scoring' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}
          >
            <Target className="w-4 h-4" /> Saisie Scores
          </button>
          <button 
            onClick={() => setActiveTab('leaderboard')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'leaderboard' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}
          >
            <Trophy className="w-4 h-4" /> Classement Direct
          </button>
          <button 
            onClick={() => setActiveTab('brackets')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'brackets' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}
          >
            <Swords className="w-4 h-4" /> Duels / Phases Finales
          </button>
          <button 
            onClick={() => setActiveTab('archers')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'archers' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}
          >
            <Users className="w-4 h-4" /> Archers ({archers.length})
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'settings' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}
          >
            <Settings className="w-4 h-4" /> Configuration
          </button>
        </nav>

        {/* CONTROLS */}
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleTheme} 
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Changer le thème"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-xl text-slate-200 border border-slate-700"
          >
            <Printer className="w-3.5 h-3.5" /> Imprimer
          </button>
        </div>
      </header>

      {/* MAIN CONTENT CONTAINERS */}
      <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto">

        {/* 1. REAL-TIME SCORING INPUT TAB */}
        {activeTab === 'scoring' && currentArcher && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* TARGET SELECTION SIDEBAR */}
            <div className={`lg:col-span-3 rounded-2xl p-4 border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                <Target className="w-4 h-4 text-amber-500" /> Cibles & Archers
              </h3>
              <div className="grid grid-cols-2 gap-2 max-h-[500px] overflow-y-auto pr-1">
                {archers.map(archer => {
                  const isSelected = archer.target === selectedTarget;
                  const stats = calculateArcherStats(archer);
                  return (
                    <button
                      key={archer.id}
                      onClick={() => setSelectedTarget(archer.target)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isSelected 
                          ? 'bg-amber-500 border-amber-400 text-slate-950 shadow-lg shadow-amber-500/20' 
                          : theme === 'dark' ? 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800' : 'bg-slate-100 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className={`text-lg font-black ${isSelected ? 'text-slate-950' : 'text-amber-400'}`}>{archer.target}</span>
                        <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-black/20">{stats.totalScore} pts</span>
                      </div>
                      <p className="text-xs font-semibold truncate mt-1">{archer.name} {archer.firstName[0]}.</p>
                      <p className={`text-[10px] truncate ${isSelected ? 'text-slate-800' : 'text-slate-400'}`}>{archer.bow}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SCORING INTERFACE */}
            <div className="lg:col-span-9 flex flex-col gap-6">
              
              {/* CURRENT ARCHER BANNER */}
              <div className={`p-5 rounded-2xl border flex flex-wrap justify-between items-center gap-4 ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-lg bg-amber-500/20 text-amber-500 font-extrabold text-sm border border-amber-500/30">
                      Cible {currentArcher.target}
                    </span>
                    <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300">
                      {currentArcher.category} • {currentArcher.bow}
                    </span>
                  </div>
                  <h2 className="text-2xl font-black mt-2">{currentArcher.firstName} {currentArcher.name}</h2>
                  <p className="text-xs text-slate-400">{currentArcher.club}</p>
                </div>

                {/* CURRENT SCORE QUICK STATS */}
                {(() => {
                  const stats = calculateArcherStats(currentArcher);
                  return (
                    <div className="flex gap-4 border-l border-slate-700/50 pl-6">
                      <div className="text-center">
                        <p className="text-xs text-slate-400 uppercase font-semibold">Total Score</p>
                        <p className="text-3xl font-black text-amber-500">{stats.totalScore}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-slate-400 uppercase font-semibold">10 / X</p>
                        <p className="text-2xl font-bold">{stats.count10} <span className="text-xs text-amber-500">({stats.countX}X)</span></p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-slate-400 uppercase font-semibold">9</p>
                        <p className="text-2xl font-bold">{stats.count9}</p>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* SET & END SELECTOR */}
              <div className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-4 ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                
                {/* SET SELECTOR */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase">Série :</span>
                  {Array.from({ length: competition.setsCount }).map((_, i) => {
                    const setNum = i + 1;
                    return (
                      <button
                        key={setNum}
                        onClick={() => setCurrentSet(setNum)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${currentSet === setNum ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                      >
                        Série {setNum}
                      </button>
                    );
                  })}
                </div>

                {/* END SELECTOR */}
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  <span className="text-xs font-bold text-slate-400 uppercase mr-1">Volée :</span>
                  {Array.from({ length: competition.endsPerSet }).map((_, i) => {
                    const endNum = i + 1;
                    const arrowKey = `s${currentSet}_e${endNum}`;
                    const endScores = currentArcher.scores[arrowKey] || [];
                    const isComplete = endScores.length === competition.arrowsPerEnd;

                    return (
                      <button
                        key={endNum}
                        onClick={() => setCurrentEnd(endNum)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold relative flex items-center justify-center transition ${
                          currentEnd === endNum 
                            ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-950' 
                            : isComplete ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {endNum}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* END INPUT DISPLAY & TOUCH PAD */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* ARROWS IN CURRENT END */}
                <div className={`md:col-span-5 p-5 rounded-2xl border flex flex-col justify-between ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex justify-between">
                      <span>Volée N° {currentEnd} (Série {currentSet})</span>
                      <span className="text-amber-500">Flèches : {(currentArcher.scores[`s${currentSet}_e${currentEnd}`] || []).length} / {competition.arrowsPerEnd}</span>
                    </h3>

                    <div className="flex items-center justify-center gap-3 py-6">
                      {Array.from({ length: competition.arrowsPerEnd }).map((_, idx) => {
                        const arrowKey = `s${currentSet}_e${currentEnd}`;
                        const currentScores = currentArcher.scores[arrowKey] || [];
                        const scoreVal = currentScores[idx];

                        return (
                          <div 
                            key={idx}
                            className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black border transition-all ${
                              scoreVal ? getScoreBadgeClass(scoreVal) : 'border-dashed border-slate-700 bg-slate-800/30 text-slate-600'
                            }`}
                          >
                            {scoreVal || '-'}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* TOTAL FOR THIS END */}
                  <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
                    <span className="text-xs text-slate-400 font-semibold">Total de la volée :</span>
                    <span className="text-2xl font-black text-amber-500">
                      {(currentArcher.scores[`s${currentSet}_e${currentEnd}`] || []).reduce((acc, v) => {
                        if (v === 'X' || v === '10') return acc + 10;
                        if (v === 'M') return acc;
                        return acc + (parseInt(v) || 0);
                      }, 0)} pts
                    </span>
                  </div>
                </div>

                {/* TOUCH KEYPAD */}
                <div className={`md:col-span-7 p-5 rounded-2xl border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Clavier de Saisie Tactile</h3>
                  
                  <div className="grid grid-cols-4 gap-2.5">
                    {['X', '10', '9', '8', '7', '6', '5', '4', '3', '2', '1', 'M'].map(key => (
                      <button
                        key={key}
                        onClick={() => handleScoreInput(key)}
                        className={`h-14 rounded-xl text-lg font-extrabold shadow-sm transition transform active:scale-95 flex items-center justify-center ${getScoreBadgeClass(key)}`}
                      >
                        {key}
                      </button>
                    ))}
                  </div>

                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={handleScoreBackspace}
                      className="flex-1 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2"
                    >
                      Effacer la dernière
                    </button>
                    <button
                      onClick={() => {
                        if (currentEnd < competition.endsPerSet) {
                          setCurrentEnd(prev => prev + 1);
                        } else if (currentSet < competition.setsCount) {
                          setCurrentSet(prev => prev + 1);
                          setCurrentEnd(1);
                        }
                      }}
                      className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10"
                    >
                      Volée Suivante <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* 2. LIVE LEADERBOARD TAB */}
        {activeTab === 'leaderboard' && (
          <div className="flex flex-col gap-6">
            
            {/* FILTERS BAR */}
            <div className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-4 ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="flex flex-wrap items-center gap-3">
                
                {/* SEARCH */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Rechercher archer / club..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`pl-9 pr-4 py-2 rounded-xl text-xs font-semibold border outline-none w-60 ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-100 border-slate-200 text-slate-900'}`}
                  />
                </div>

                {/* CATEGORY FILTER */}
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border outline-none ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-100 border-slate-200 text-slate-900'}`}
                >
                  <option value="ALL">Toutes les Catégories</option>
                  <option value="U15">U15</option>
                  <option value="U18">U18</option>
                  <option value="U21">U21</option>
                  <option value="Senior 1">Senior 1</option>
                  <option value="Senior 2">Senior 2</option>
                  <option value="Senior 3">Senior 3</option>
                </select>

                {/* BOW FILTER */}
                <select
                  value={bowFilter}
                  onChange={(e) => setBowFilter(e.target.value)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border outline-none ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-100 border-slate-200 text-slate-900'}`}
                >
                  <option value="ALL">Toutes les Armes</option>
                  <option value="Classique">Classique (Recurve)</option>
                  <option value="Arc à poulies">Arc à poulies (Compound)</option>
                  <option value="Arc Nu">Arc Nu (Barebow)</option>
                  <option value="Longbow">Longbow</option>
                </select>

              </div>

              <div className="text-xs text-slate-400 font-semibold">
                Archers affichés : {filteredLeaderboard.length} / {archers.length}
              </div>
            </div>

            {/* LEADERBOARD TABLE */}
            <div className={`rounded-2xl border overflow-hidden ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`text-[11px] font-extrabold uppercase tracking-wider border-b ${theme === 'dark' ? 'bg-slate-800/50 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
                      <th className="p-3.5 text-center w-12">Rang</th>
                      <th className="p-3.5">Cible</th>
                      <th className="p-3.5">Archer</th>
                      <th className="p-3.5">Club</th>
                      <th className="p-3.5">Catégorie</th>
                      <th className="p-3.5 text-center">Série 1</th>
                      <th className="p-3.5 text-center">Série 2</th>
                      <th className="p-3.5 text-center">10s</th>
                      <th className="p-3.5 text-center">Xs</th>
                      <th className="p-3.5 text-right pr-6">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 text-xs">
                    {filteredLeaderboard.map((archer, idx) => {
                      const rank = idx + 1;
                      return (
                        <tr key={archer.id} className={`hover:bg-slate-800/30 transition ${rank <= 3 ? 'font-semibold' : ''}`}>
                          <td className="p-3.5 text-center">
                            {rank === 1 ? <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-black">1</span> :
                             rank === 2 ? <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300 text-slate-950 font-black">2</span> :
                             rank === 3 ? <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-700 text-white font-black">3</span> :
                             <span className="text-slate-400 font-bold">{rank}</span>}
                          </td>
                          <td className="p-3.5 font-bold text-amber-500">{archer.target}</td>
                          <td className="p-3.5 font-bold text-sm">
                            {archer.name} {archer.firstName}
                          </td>
                          <td className="p-3.5 text-slate-400">{archer.club}</td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px]">
                              {archer.category} • {archer.bow}
                            </span>
                          </td>
                          <td className="p-3.5 text-center font-bold text-slate-300">{archer.stats.setTotals[1] || 0}</td>
                          <td className="p-3.5 text-center font-bold text-slate-300">{archer.stats.setTotals[2] || 0}</td>
                          <td className="p-3.5 text-center text-amber-400 font-bold">{archer.stats.count10}</td>
                          <td className="p-3.5 text-center text-amber-500/80 font-bold">{archer.stats.countX}</td>
                          <td className="p-3.5 text-right pr-6 text-base font-black text-amber-500">{archer.stats.totalScore}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* 3. DUELS & BRACKETS TAB */}
        {activeTab === 'brackets' && (
          <div className="flex flex-col gap-6">
            <div className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-4 ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Swords className="w-4 h-4 text-amber-500" /> Arbre d'Élimination Directe
                </h3>
                <p className="text-xs text-slate-400">Phase Finale Top 4 / Top 8 selon les qualifications</p>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => alert("Grille réinitialisée basée sur les qualifications actuelles")}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold text-xs transition"
                >
                  Générer depuis Qualification
                </button>
              </div>
            </div>

            {/* BRACKET VISUALIZER */}
            <div className={`p-6 rounded-2xl border overflow-x-auto ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="min-w-[700px] flex items-center justify-between gap-12 py-4">
                
                {/* DEMI FINALES */}
                <div className="flex-1 flex flex-col justify-around gap-12">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 text-center mb-2">1/2 Finales</h4>
                  
                  {/* MATCH 1 */}
                  <div className={`p-3 rounded-xl border flex flex-col gap-2 ${theme === 'dark' ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
                    <div className="flex justify-between items-center text-xs font-bold p-1 rounded bg-amber-500/10 text-amber-400">
                      <span>#1 {rankedArchers[0]?.name || 'Archer 1'}</span>
                      <span className="px-2 py-0.5 bg-amber-500 text-slate-950 rounded">6 pts</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold p-1 rounded text-slate-400">
                      <span>#4 {rankedArchers[3]?.name || 'Archer 4'}</span>
                      <span className="px-2 py-0.5 bg-slate-700 text-slate-300 rounded">2 pts</span>
                    </div>
                  </div>

                  {/* MATCH 2 */}
                  <div className={`p-3 rounded-xl border flex flex-col gap-2 ${theme === 'dark' ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
                    <div className="flex justify-between items-center text-xs font-bold p-1 rounded text-slate-400">
                      <span>#3 {rankedArchers[2]?.name || 'Archer 3'}</span>
                      <span className="px-2 py-0.5 bg-slate-700 text-slate-300 rounded">4 pts</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold p-1 rounded bg-amber-500/10 text-amber-400">
                      <span>#2 {rankedArchers[1]?.name || 'Archer 2'}</span>
                      <span className="px-2 py-0.5 bg-amber-500 text-slate-950 rounded">6 pts</span>
                    </div>
                  </div>

                </div>

                {/* FINALE & BRONZE */}
                <div className="flex-1 flex flex-col gap-8 justify-center">
                  
                  {/* FINALE OR */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 text-center mb-2 flex items-center justify-center gap-1">
                      <Award className="w-4 h-4" /> Finale Or / Argent
                    </h4>
                    <div className={`p-4 rounded-2xl border-2 border-amber-500/50 flex flex-col gap-2 shadow-xl ${theme === 'dark' ? 'bg-slate-800 border-amber-500/40' : 'bg-amber-50 border-amber-300'}`}>
                      <div className="flex justify-between items-center text-sm font-black p-1.5 rounded bg-amber-500/20 text-amber-400">
                        <span>{rankedArchers[0]?.name || 'Archer 1'}</span>
                        <span className="px-2.5 py-1 bg-amber-500 text-slate-950 rounded-lg">6</span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-bold p-1.5 rounded text-slate-400">
                        <span>{rankedArchers[1]?.name || 'Archer 2'}</span>
                        <span className="px-2.5 py-1 bg-slate-700 text-slate-300 rounded-lg">0</span>
                      </div>
                    </div>
                  </div>

                  {/* FINALE BRONZE */}
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-amber-700 text-center mb-1">Petite Finale (Bronze)</h4>
                    <div className={`p-3 rounded-xl border flex flex-col gap-2 ${theme === 'dark' ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
                      <div className="flex justify-between items-center text-xs font-bold p-1 text-slate-300">
                        <span>{rankedArchers[2]?.name || 'Archer 3'}</span>
                        <span className="px-2 py-0.5 bg-amber-700 text-white rounded">6</span>
                      </div>
                      <div className="flex justify-between items-center text-xs font-bold p-1 text-slate-500">
                        <span>{rankedArchers[3]?.name || 'Archer 4'}</span>
                        <span className="px-2 py-0.5 bg-slate-700 text-slate-300 rounded">2</span>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          </div>
        )}

        {/* 4. ARCHERS MANAGEMENT TAB */}
        {activeTab === 'archers' && (
          <div className="flex flex-col gap-6">
            <div className={`p-4 rounded-2xl border flex justify-between items-center ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Gestion des Inscriptions</h3>
              <button
                onClick={() => {
                  setEditingArcher(null);
                  setArcherForm({ name: '', firstName: '', club: '', category: 'Senior 1', bow: 'Classique', target: '01A' });
                  setIsArcherModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-lg shadow-amber-500/10"
              >
                <UserPlus className="w-4 h-4" /> Ajouter un Archer
              </button>
            </div>

            {/* ARCHER LIST TABLE */}
            <div className={`rounded-2xl border overflow-hidden ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`text-[11px] font-extrabold uppercase tracking-wider border-b ${theme === 'dark' ? 'bg-slate-800/50 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
                    <th className="p-3.5">Cible</th>
                    <th className="p-3.5">Nom & Prénom</th>
                    <th className="p-3.5">Club</th>
                    <th className="p-3.5">Catégorie</th>
                    <th className="p-3.5">Arme</th>
                    <th className="p-3.5 text-right pr-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-xs">
                  {archers.map(archer => (
                    <tr key={archer.id} className="hover:bg-slate-800/30 transition">
                      <td className="p-3.5 font-black text-amber-500">{archer.target}</td>
                      <td className="p-3.5 font-bold text-sm">{archer.name} {archer.firstName}</td>
                      <td className="p-3.5 text-slate-400">{archer.club}</td>
                      <td className="p-3.5">{archer.category}</td>
                      <td className="p-3.5">{archer.bow}</td>
                      <td className="p-3.5 text-right pr-6">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => {
                              setEditingArcher(archer);
                              setArcherForm(archer);
                              setIsArcherModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteArcher(archer.id)}
                            className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. SETTINGS & CONFIGURATION TAB */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto flex flex-col gap-6">
            <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <h3 className="text-base font-bold text-amber-500 mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5" /> Configuration de la Compétition
              </h3>

              <div className="flex flex-col gap-4 text-xs">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Nom du Concours</label>
                  <input
                    type="text"
                    value={competition.name}
                    onChange={(e) => setCompetition({ ...competition, name: e.target.value })}
                    className={`w-full p-2.5 rounded-xl border outline-none font-semibold ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-100 border-slate-200 text-slate-900'}`}
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Discipline / Type de Tir</label>
                  <select
                    value={competition.discipline}
                    onChange={(e) => setCompetition({ ...competition, discipline: e.target.value })}
                    className={`w-full p-2.5 rounded-xl border outline-none font-semibold ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-100 border-slate-200 text-slate-900'}`}
                  >
                    <option value="SALLE_18M">Tir en Salle (18m - 2x10 volées de 3 flèches)</option>
                    <option value="TAE_INTERNATIONAL">TAE International (70m / 50m - 2x6 volées de 6 flèches)</option>
                    <option value="TAE_NATIONAL">TAE National (50m - 2x6 volées de 6 flèches)</option>
                    <option value="CAMPAGNE">Tir Campagne</option>
                    <option value="3D">Tir 3D</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Nombre de Séries</label>
                    <input
                      type="number"
                      value={competition.setsCount}
                      onChange={(e) => setCompetition({ ...competition, setsCount: parseInt(e.target.value) || 2 })}
                      className={`w-full p-2.5 rounded-xl border outline-none font-semibold ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-100 border-slate-200 text-slate-900'}`}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Volées par Série</label>
                    <input
                      type="number"
                      value={competition.endsPerSet}
                      onChange={(e) => setCompetition({ ...competition, endsPerSet: parseInt(e.target.value) || 6 })}
                      className={`w-full p-2.5 rounded-xl border outline-none font-semibold ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-100 border-slate-200 text-slate-900'}`}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-end">
                  <button 
                    onClick={() => alert("Configuration sauvegardée !")}
                    className="px-5 py-2.5 bg-amber-500 text-slate-950 font-black rounded-xl hover:bg-amber-400 transition shadow-lg shadow-amber-500/10"
                  >
                    Enregistrer les paramètres
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ARCHER ADD/EDIT MODAL */}
      {isArcherModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-2xl p-6 border shadow-2xl ${theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}>
            <h3 className="text-lg font-black mb-4">{editingArcher ? 'Modifier Archer' : 'Nouvel Archer'}</h3>
            
            <form onSubmit={handleSaveArcher} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Nom</label>
                <input
                  type="text"
                  required
                  value={archerForm.name}
                  onChange={(e) => setArcherForm({ ...archerForm, name: e.target.value.toUpperCase() })}
                  className={`w-full p-2.5 rounded-xl border outline-none font-semibold ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'}`}
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Prénom</label>
                <input
                  type="text"
                  required
                  value={archerForm.firstName}
                  onChange={(e) => setArcherForm({ ...archerForm, firstName: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border outline-none font-semibold ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'}`}
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Club / Compagnie</label>
                <input
                  type="text"
                  required
                  value={archerForm.club}
                  onChange={(e) => setArcherForm({ ...archerForm, club: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border outline-none font-semibold ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Catégorie</label>
                  <select
                    value={archerForm.category}
                    onChange={(e) => setArcherForm({ ...archerForm, category: e.target.value })}
                    className={`w-full p-2.5 rounded-xl border outline-none font-semibold ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'}`}
                  >
                    <option value="U15">U15</option>
                    <option value="U18">U18</option>
                    <option value="U21">U21</option>
                    <option value="Senior 1">Senior 1</option>
                    <option value="Senior 2">Senior 2</option>
                    <option value="Senior 3">Senior 3</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Arme</label>
                  <select
                    value={archerForm.bow}
                    onChange={(e) => setArcherForm({ ...archerForm, bow: e.target.value })}
                    className={`w-full p-2.5 rounded-xl border outline-none font-semibold ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'}`}
                  >
                    <option value="Classique">Classique</option>
                    <option value="Arc à poulies">Arc à poulies</option>
                    <option value="Arc Nu">Arc Nu</option>
                    <option value="Longbow">Longbow</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Numéro de Cible (ex: 01A, 02B)</label>
                <input
                  type="text"
                  required
                  value={archerForm.target}
                  onChange={(e) => setArcherForm({ ...archerForm, target: e.target.value.toUpperCase() })}
                  className={`w-full p-2.5 rounded-xl border outline-none font-semibold ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'}`}
                />
              </div>

              <div className="mt-4 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsArcherModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-black transition shadow-lg shadow-amber-500/10"
                >
                  {editingArcher ? 'Mettre à jour' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}