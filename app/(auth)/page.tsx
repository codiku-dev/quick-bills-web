"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Star, Shield, Zap, Users, Mail, Lock, Github } from "lucide-react"

export default function AuthPage() {
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        // Simulate loading - you'll replace this with Clerk later
        setTimeout(() => setIsLoading(false), 2000)
    }

    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            {/* Left side - Authentication */}
            <div className="flex items-center justify-center p-8 bg-background">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
                        <p className="text-muted-foreground">Sign in to your account to continue</p>
                    </div>

                    <div className="space-y-6">
                        {/* Social Login Buttons */}
                        <div className="space-y-3">
                            <Button variant="outline" className="w-full bg-transparent" disabled={isLoading}>
                                <Github className="mr-2 h-4 w-4" />
                                Continue with GitHub
                            </Button>
                            <Button variant="outline" className="w-full bg-transparent" disabled={isLoading}>
                                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                                    <path
                                        fill="currentColor"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    />
                                </svg>
                                Continue with Google
                            </Button>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <Separator className="w-full" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                            </div>
                        </div>

                        {/* Email/Password Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input id="email" type="email" placeholder="Enter your email" className="pl-10" required />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input id="password" type="password" placeholder="Enter your password" className="pl-10" required />
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <input id="remember" type="checkbox" className="h-4 w-4 rounded border-gray-300" />
                                    <Label htmlFor="remember" className="text-sm font-normal">
                                        Remember me
                                    </Label>
                                </div>
                                <Button variant="link" className="px-0 text-sm">
                                    Forgot password?
                                </Button>
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? "Signing in..." : "Sign in"}
                            </Button>
                        </form>

                        <div className="text-center text-sm">
                            <span className="text-muted-foreground">Don't have an account? </span>
                            <Button variant="link" className="px-0">
                                Sign up
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right side - Branding */}
            <div className="hidden lg:flex flex-col justify-center p-12 bg-gradient-to-br from-primary/10 via-primary/5 to-background relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute inset-0 bg-grid-white/10 bg-grid-16 [mask-image:radial-gradient(white,transparent_70%)]" />

                <div className="relative z-10 space-y-8">
                    {/* Logo/Brand */}
                    <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                                <Zap className="w-5 h-5 text-primary-foreground" />
                            </div>
                            <span className="text-2xl font-bold">Acme Corp</span>
                        </div>
                        <p className="text-xl text-muted-foreground">The future of productivity starts here</p>
                    </div>

                    {/* Features */}
                    <div className="space-y-6">
                        <div className="flex items-start space-x-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Shield className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Enterprise Security</h3>
                                <p className="text-sm text-muted-foreground">
                                    Bank-level encryption and security protocols to keep your data safe
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Users className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Team Collaboration</h3>
                                <p className="text-sm text-muted-foreground">
                                    Work seamlessly with your team across projects and departments
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Zap className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Lightning Fast</h3>
                                <p className="text-sm text-muted-foreground">
                                    Optimized performance that scales with your growing business
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Testimonial */}
                    <div className="bg-background/50 backdrop-blur-sm rounded-lg p-6 border">
                        <div className="flex items-center space-x-1 mb-3">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                            ))}
                        </div>
                        <blockquote className="text-sm mb-3">
                            "This platform has transformed how our team works. The intuitive interface and powerful features make
                            complex projects feel effortless."
                        </blockquote>
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                                <span className="text-xs font-semibold text-primary">SJ</span>
                            </div>
                            <div>
                                <p className="text-sm font-medium">Sarah Johnson</p>
                                <p className="text-xs text-muted-foreground">Product Manager, TechCorp</p>
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 pt-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-primary">10K+</div>
                            <div className="text-xs text-muted-foreground">Active Users</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-primary">99.9%</div>
                            <div className="text-xs text-muted-foreground">Uptime</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-primary">24/7</div>
                            <div className="text-xs text-muted-foreground">Support</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
