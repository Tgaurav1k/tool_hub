import React from 'react'
import {
  Receipt, Wallet, FileText, FileSignature, PieChart, Banknote, CreditCard,
  DollarSign, Megaphone, Target, CalendarDays, Globe, Mail, Share2, LineChart,
  Settings, Package, Truck, Building2, Workflow, Gauge, Warehouse, ClipboardList,
  Users, UserPlus, CalendarCheck, Briefcase, Award, GraduationCap, UsersRound,
  TrendingUp, Handshake, Map, Trophy, Sparkles,
  LayoutGrid, Star, BookOpen, DoorOpen, BellRing, Timer, Bookmark,
  Home, Monitor, LifeBuoy, HardDrive, KeyRound, AlertTriangle, Activity,
  Wrench, Zap, Box, type LucideIcon,
} from 'lucide-react'

const ICON_REGISTRY: Record<string, LucideIcon> = {
  Receipt, Wallet, FileText, FileSignature, PieChart, Banknote, CreditCard,
  DollarSign, Megaphone, Target, CalendarDays, Globe, Mail, Share2, LineChart,
  Settings, Package, Truck, Building2, Workflow, Gauge, Warehouse, ClipboardList,
  Users, UserPlus, CalendarCheck, Briefcase, Award, GraduationCap, UsersRound,
  TrendingUp, Handshake, Map, Trophy, Sparkles,
  LayoutGrid, Star, BookOpen, DoorOpen, BellRing, Timer, Bookmark,
  Home, Monitor, LifeBuoy, HardDrive, KeyRound, AlertTriangle, Activity,
  Wrench, Zap, Box,
}

export function getIcon(name: string, props: { size?: number } = {}): React.ReactNode {
  const Icon = ICON_REGISTRY[name]
  if (!Icon) return <Box size={props.size ?? 20} />
  return <Icon size={props.size ?? 20} />
}

export function getIconComponent(name: string): LucideIcon {
  return ICON_REGISTRY[name] ?? Box
}
