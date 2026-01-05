import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Trophy, Users, Zap, Star, Gamepad2, Shield } from 'lucide-react'

const Home = () => {
  const { isAuthenticated, user } = useAuth()

  const features = [
    {
      icon: Trophy,
      title: 'Competitive Tournaments',
      description: 'Join 1v1, Squad, and Free-for-All tournaments with real cash prizes'
    },
    {
      icon: Users,
      title: 'Social Gaming',
      description: 'Connect with friends, form squads, and climb the ranks together'
    },
    {
      icon: Zap,
      title: 'Instant Withdrawals',
      description: 'Get your winnings quickly with secure payment processing'
    },
    {
      icon: Shield,
      title: 'Secure Platform',
      description: 'Your data and funds are protected with enterprise-grade security'
    }
  ]

  const games = [
    { name: 'Call of Duty: Mobile', players: '10K+', tournaments: '50+' },
    { name: 'PUBG Mobile', players: '8K+', tournaments: '45+' },
    { name: 'Free Fire', players: '7K+', tournaments: '40+' },
    { name: 'Fortnite', players: '6K+', tournaments: '35+' },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center bg-purple-gradient overflow-hidden">
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 fade-in">
            Welcome to <span className="gradient-text">XP Platform</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-gray-200 fade-in">
            The ultimate destination for competitive mobile gaming. 
            <br />Compete, connect, and earn real rewards.
          </p>
          
          {isAuthenticated ? (
            <div className="space-y-4 fade-in">
              <p className="text-lg">Welcome back, <span className="text-purple-400 font-semibold">{user ? user.username : 'Guest'}</span>!</p> {/* NULL CHECK ADDED */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/tournaments" className="btn-primary text-lg px-8 py-4">
                  <Trophy className="w-5 h-5 mr-2" />
                  Join Tournaments
                </Link>
                <Link to="/dashboard" className="btn-secondary text-lg px-8 py-4">
                  <Gamepad2 className="w-5 h-5 mr-2" />
                  Go to Dashboard
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center fade-in">
              <Link to="/register" className="btn-primary text-lg px-8 py-4">
                Start Playing
              </Link>
              <Link to="/login" className="btn-secondary text-lg px-8 py-4">
                Sign In
              </Link>
            </div>
          )}
        </div>
        
        {/* Animated background elements */}
        <div className="absolute top-1/4 left-1/4 w-20 h-20 bg-purple-500 rounded-full opacity-20 animate-float"></div>
        <div className="absolute top-1/3 right-1/4 w-16 h-16 bg-blue-500 rounded-full opacity-20 animate-float" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-1/4 left-1/3 w-12 h-12 bg-purple-400 rounded-full opacity-20 animate-float" style={{animationDelay: '2s'}}></div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why Choose XP Platform?</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              We've built the most comprehensive gaming tournament platform with features 
              designed for both casual and competitive gamers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div key={index} className="card text-center group">
                  <div className="w-16 h-16 bg-purple-gradient rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Games Section */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Popular Games</h2>
            <p className="text-xl text-gray-400">
              Compete in your favorite mobile games
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {games.map((game, index) => (
              <div key={index} className="card group hover:border-purple-500 transition-all duration-300">
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mb-4">
                  <Gamepad2 className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{game.name}</h3>
                <div className="space-y-1 text-sm text-gray-400">
                  <p>👥 {game.players} active players</p>
                  <p>🏆 {game.tournaments} live tournaments</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-purple-gradient">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Compete?</h2>
          <p className="text-xl mb-8 text-gray-200 max-w-2xl mx-auto">
            Join thousands of gamers who are already earning rewards and building their legacy.
          </p>
          {!isAuthenticated && (
            <Link to="/register" className="btn-secondary text-lg px-8 py-4 bg-white/10 border-white text-white hover:bg-white hover:text-purple-600">
              <Star className="w-5 h-5 mr-2" />
              Start Your Journey
            </Link>
          )}
        </div>
      </section>
    </div>
  )
}

export default Home