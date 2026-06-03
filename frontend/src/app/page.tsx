'use client';
import { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect, useReadContract, useWriteContract, useBalance, useChainId, useSwitchChain, useWaitForTransactionReceipt, useWatchContractEvent } from 'wagmi';
import { formatEther } from 'viem';
import { injected } from 'wagmi/connectors';
import { abi, contractAddress } from '@/constants';
import { Sparkles, Trophy, Users, Wallet, RefreshCcw } from 'lucide-react';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const isWrongNetwork = chainId !== 11155111; // Sepolia


  // Read state from contract
  const { data: entranceFee } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi,
    functionName: 'getEntranceFee',
  });

  const { data: playersCount, refetch: refetchPlayers } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi,
    functionName: 'getNumberOfPlayers',
  });

  const { data: lotteryState, refetch: refetchState } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi,
    functionName: 'getLotteryState',
  });

  const { data: recentWinner, refetch: refetchWinner } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi,
    functionName: 'getRecentWinner',
  });

  const { data: contractBalance, refetch: refetchBalance } = useBalance({
    address: contractAddress as `0x${string}`,
  });

  const { writeContract, writeContractAsync, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isConfirmed) {
      refetchPlayers();
      refetchState();
      refetchBalance();
    }
  }, [isConfirmed, refetchPlayers, refetchState, refetchBalance]);

  useWatchContractEvent({
    address: contractAddress as `0x${string}`,
    abi,
    eventName: 'WinnerPicked',
    onLogs() {
      refetchPlayers();
      refetchState();
      refetchBalance();
      refetchWinner();
    },
  });

  const handleEnterLottery = () => {
    if (!entranceFee) return;
    writeContract({
      address: contractAddress as `0x${string}`,
      abi,
      functionName: 'enterLottery',
      value: entranceFee as bigint,
    });
  };

  const handleDrawWinner = async (e: any) => {
    e.preventDefault();
    console.log("--> Draw Winner Button Clicked!");
    alert("Button Clicked!"); // visual feedback
    try {
      console.log("Calling performUpkeep on contract:", contractAddress);
      await writeContractAsync({
        address: contractAddress as `0x${string}`,
        abi,
        functionName: 'performUpkeep',
      });
      console.log("--> writeContractAsync resolved!");
    } catch (err: any) {
      console.error("Draw Winner Error:", err);
      alert("Failed to draw winner: " + (err.shortMessage || err.message || "Unknown error"));
    }
  };

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center py-8 md:py-12 px-4 md:px-8 relative overflow-hidden">

      {/* Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[80%] md:w-[40%] h-[40%] bg-blue-600/30 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[80%] md:w-[40%] h-[40%] bg-purple-600/30 blur-[120px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="w-full max-w-5xl flex flex-col sm:flex-row justify-between items-center gap-6 sm:gap-0 mb-10 md:mb-16 z-10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-blue-400" />
          <h1 className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            Nexus Lottery
          </h1>
        </div>
        <div>
          {isConnected ? (
            <button
              onClick={() => disconnect()}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl transition-all border border-slate-700 hover:border-slate-600 shadow-lg"
            >
              <Wallet className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </span>
            </button>
          ) : (
            <button
              onClick={() => connect({ connector: injected() })}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 px-5 py-2 md:px-6 md:py-2.5 rounded-xl transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] font-medium text-sm md:text-base"
            >
              <Wallet className="w-4 h-4" />
              Connect Wallet
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="w-full max-w-3xl flex flex-col gap-6 md:gap-8 z-10">
        
        {/* Prize Pool Card */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col items-center justify-center shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <h2 className="text-slate-400 font-medium mb-2 uppercase tracking-widest text-xs md:text-sm">Current Prize Pool</h2>
          <div className="flex items-end gap-2 text-5xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-br from-white to-slate-400 mb-6 md:mb-8">
            {contractBalance ? formatEther(contractBalance.value) : '0'} 
            <span className="text-2xl md:text-3xl font-bold text-blue-400 mb-1 md:mb-2">ETH</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 w-full">
            {isConnected && isWrongNetwork ? (
              <button
                onClick={() => switchChain({ chainId: 11155111 })}
                className="col-span-2 relative overflow-hidden w-full py-4 rounded-2xl bg-gradient-to-r from-red-600 to-orange-600 font-bold text-lg text-white shadow-[0_0_40px_rgba(220,38,38,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Switch to Sepolia Network
              </button>
            ) : (
              <>
                <button
                  onClick={handleEnterLottery}
                  disabled={!isConnected || isPending || isConfirming || lotteryState === 1}
                  className="relative overflow-hidden w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 font-bold text-lg text-white shadow-[0_0_40px_rgba(79,70,229,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100"
                >
                  {isPending || isConfirming ? 'Processing...' : 'Enter Lottery'}
                </button>
                <button
                  onClick={handleDrawWinner}
                  disabled={!isConnected || isPending || isConfirming || !playersCount || Number(playersCount) === 0 || lotteryState === 1}
                  className="w-full py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 font-bold text-lg text-slate-200 border border-slate-700 transition-all hover:border-slate-500 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Trophy className="w-5 h-5 text-yellow-500 pointer-events-none" />
                  {isPending || isConfirming
                    ? 'Processing...'
                    : lotteryState === 1
                      ? 'Calculating Winner...'
                      : Number(playersCount) === 0
                        ? 'Need Players to Draw'
                        : 'Draw Winner'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 flex flex-col items-center text-center">
            <Users className="w-6 h-6 text-indigo-400 mb-3" />
            <p className="text-slate-400 text-sm mb-1">Total Players</p>
            <p className="text-2xl font-bold text-white">{playersCount ? Number(playersCount) : '0'}</p>
          </div>
          
          <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 flex flex-col items-center text-center">
            <RefreshCcw className="w-6 h-6 text-emerald-400 mb-3" />
            <p className="text-slate-400 text-sm mb-1">Status</p>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${lotteryState === 0 ? 'bg-emerald-500 animate-pulse' : lotteryState === 1 ? 'bg-amber-500 animate-pulse' : 'bg-slate-500'}`} />
              <p className="text-2xl font-bold text-white">
                {lotteryState === 0 ? 'OPEN' : lotteryState === 1 ? 'CALCULATING' : 'LOADING'}
              </p>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 flex flex-col items-center text-center">
            <Wallet className="w-6 h-6 text-amber-400 mb-3" />
            <p className="text-slate-400 text-sm mb-1">Entry Fee</p>
            <p className="text-2xl font-bold text-white">
              {entranceFee ? formatEther(entranceFee as bigint) : '0.01'} ETH
            </p>
          </div>
        </div>

        {/* Recent Winner */}
        {recentWinner && recentWinner !== '0x0000000000000000000000000000000000000000' && (
          <div className="mt-8 bg-gradient-to-r from-yellow-500/10 to-amber-500/5 border border-yellow-500/20 rounded-2xl p-6 text-center">
            <h3 className="text-yellow-500 font-semibold mb-2 flex items-center justify-center gap-2">
              <Trophy className="w-5 h-5" />
              Previous Winner
            </h3>
            <p className="text-slate-300 font-mono text-sm break-all">
              {recentWinner as string}
            </p>
          </div>
        )}

      </div>
    </main>
  );
}
