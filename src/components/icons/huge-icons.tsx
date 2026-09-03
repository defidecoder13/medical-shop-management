"use client";

import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import type { IconSvgElement } from "@hugeicons/react";

import {
  Activity01Icon,
  AlertCircleIcon,
  AlertSquareIcon,
  Alert02Icon,
  ArrowDownRight01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowUpDownIcon,
  ArrowUpRight01Icon,
  BanknoteIcon,
  Analytics01Icon,
  Package01Icon,
  Building01Icon,
  Calculator01Icon,
  Calendar01Icon,
  Calendar02Icon,
  CheckmarkCircle02Icon,
  DollarSquareIcon,
  Clock01Icon,
  UserSquareIcon,
  Copy01Icon,
  CreditCardIcon,
  DatabaseIcon,
  Download01Icon,
  PencilEdit02Icon,
  PencilEdit01Icon,
  ViewIcon,
  ViewOffSlashIcon,
  FileSpreadsheetIcon,
  File01Icon,
  FilterIcon,
  ChartBarLineIcon,
  Globe02Icon,
  Tag01Icon,
  Time02Icon,
  Home01Icon,
  ReceiptIndianRupeeIcon,
  InformationCircleIcon,
  Layers01Icon,
  DashboardSquare01Icon,
  Loading03Icon,
  LockKeyIcon,
  Logout01Icon,
  Mail01Icon,
  Location01Icon,
  MedalFirstPlaceIcon,
  Menu01Icon,
  MinusSignIcon,
  Moon02Icon,
  MoreVerticalIcon,
  PackageIcon,
  PackageOpenIcon,
  PackagePlusIcon,
  PackageXIcon,
  Discount01Icon,
  Call02Icon,
  PieChartIcon,
  Medicine01Icon,
  PlusSignIcon,
  PrinterIcon,
  ReceiptIcon,
  Invoice01Icon,
  Refresh01Icon,
  FloppyDiskIcon,
  Search01Icon,
  SentIcon,
  Settings01Icon,
  ShieldCheckIcon,
  ShoppingCart01Icon,
  SparklesIcon,
  StethoscopeIcon,
  ShopSignIcon,
  Sun01Icon,
  Delete02Icon,
  ChartBreakoutCircleIcon,
  AnalyticsUpIcon,
  TrophyIcon,
  DeliveryTruck01Icon,
  UndoIcon,
  Undo02Icon,
  Upload01Icon,
  CloudUploadIcon,
  UserIcon,
  UserAdd01Icon,
  UserGroupIcon,
  Wallet01Icon,
  WifiHighIcon,
  WifiDisconnected01Icon,
  Cancel01Icon,
  CancelCircleIcon,
  FlashIcon,
} from "@hugeicons/core-free-icons";

export interface HugeIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
  strokeWidth?: number;
  color?: string;
}

export function createHugeIcon(icon: IconSvgElement | any) {
  const Component = React.forwardRef<SVGSVGElement, HugeIconProps>(function HugeIconWrapper(
    { size = 20, className = "", strokeWidth = 1.6, color = "currentColor", ...rest },
    ref
  ) {
    return (
      <span ref={ref as any} className={`inline-flex items-center justify-center ${className}`}>
        <HugeiconsIcon
          icon={icon}
          size={size}
          strokeWidth={strokeWidth}
          color={color}
          {...(rest as any)}
        />
      </span>
    );
  });
  Component.displayName = `HugeIcon(${icon?.name || "Icon"})`;
  return Component;
}

// 94 Mapped Hugeicons
export const Activity = createHugeIcon(Activity01Icon);
export const AlertCircle = createHugeIcon(AlertCircleIcon);
export const AlertOctagon = createHugeIcon(AlertSquareIcon);
export const AlertTriangle = createHugeIcon(Alert02Icon);
export const ArrowDownRight = createHugeIcon(ArrowDownRight01Icon);
export const ArrowLeft = createHugeIcon(ArrowLeft01Icon);
export const ArrowRight = createHugeIcon(ArrowRight01Icon);
export const ArrowUpDown = createHugeIcon(ArrowUpDownIcon);
export const ArrowUpRight = createHugeIcon(ArrowUpRight01Icon);
export const Banknote = createHugeIcon(BanknoteIcon);
export const BarChart3 = createHugeIcon(Analytics01Icon);
export const Boxes = createHugeIcon(Package01Icon);
export const Building2 = createHugeIcon(Building01Icon);
export const Calculator = createHugeIcon(Calculator01Icon);
export const Calendar = createHugeIcon(Calendar01Icon);
export const CalendarClock = createHugeIcon(Calendar02Icon);
export const CheckCircle2 = createHugeIcon(CheckmarkCircle02Icon);
export const ChevronLeft = createHugeIcon(ArrowLeft01Icon);
export const ChevronRight = createHugeIcon(ArrowRight01Icon);
export const CircleDollarSign = createHugeIcon(DollarSquareIcon);
export const Clock = createHugeIcon(Clock01Icon);
export const Contact = createHugeIcon(UserSquareIcon);
export const Copy = createHugeIcon(Copy01Icon);
export const CreditCard = createHugeIcon(CreditCardIcon);
export const Database = createHugeIcon(DatabaseIcon);
export const Download = createHugeIcon(Download01Icon);
export const Edit = createHugeIcon(PencilEdit02Icon);
export const Edit3 = createHugeIcon(PencilEdit01Icon);
export const Eye = createHugeIcon(ViewIcon);
export const EyeOff = createHugeIcon(ViewOffSlashIcon);
export const FileSpreadsheet = createHugeIcon(FileSpreadsheetIcon);
export const FileText = createHugeIcon(File01Icon);
export const Filter = createHugeIcon(FilterIcon);
export const GanttChartSquare = createHugeIcon(ChartBarLineIcon);
export const Globe = createHugeIcon(Globe02Icon);
export const Hash = createHugeIcon(Tag01Icon);
export const History = createHugeIcon(Time02Icon);
export const Home = createHugeIcon(Home01Icon);
export const IndianRupee = createHugeIcon(ReceiptIndianRupeeIcon);
export const Info = createHugeIcon(InformationCircleIcon);
export const Layers = createHugeIcon(Layers01Icon);
export const LayoutGrid = createHugeIcon(DashboardSquare01Icon);
export const Loader2 = createHugeIcon(Loading03Icon);
export const Lock = createHugeIcon(LockKeyIcon);
export const LogOut = createHugeIcon(Logout01Icon);
export const Mail = createHugeIcon(Mail01Icon);
export const MapPin = createHugeIcon(Location01Icon);
export const Medal = createHugeIcon(MedalFirstPlaceIcon);
export const Menu = createHugeIcon(Menu01Icon);
export const Minus = createHugeIcon(MinusSignIcon);
export const Moon = createHugeIcon(Moon02Icon);
export const MoreVertical = createHugeIcon(MoreVerticalIcon);
export const Package = createHugeIcon(PackageIcon);
export const PackageOpen = createHugeIcon(PackageOpenIcon);
export const PackagePlus = createHugeIcon(PackagePlusIcon);
export const PackageX = createHugeIcon(PackageXIcon);
export const Percent = createHugeIcon(Discount01Icon);
export const Phone = createHugeIcon(Call02Icon);
export const PieChart = createHugeIcon(PieChartIcon);
export const Pill = createHugeIcon(Medicine01Icon);
export const Plus = createHugeIcon(PlusSignIcon);
export const Printer = createHugeIcon(PrinterIcon);
export const Receipt = createHugeIcon(ReceiptIcon);
export const ReceiptText = createHugeIcon(Invoice01Icon);
export const RotateCcw = createHugeIcon(Refresh01Icon);
export const Save = createHugeIcon(FloppyDiskIcon);
export const Search = createHugeIcon(Search01Icon);
export const Send = createHugeIcon(SentIcon);
export const Settings = createHugeIcon(Settings01Icon);
export const ShieldCheck = createHugeIcon(ShieldCheckIcon);
export const ShoppingCart = createHugeIcon(ShoppingCart01Icon);
export const Sparkles = createHugeIcon(SparklesIcon);
export const Stethoscope = createHugeIcon(StethoscopeIcon);
export const Store = createHugeIcon(ShopSignIcon);
export const Sun = createHugeIcon(Sun01Icon);
export const Tag = createHugeIcon(Tag01Icon);
export const Trash2 = createHugeIcon(Delete02Icon);
export const TrendingDown = createHugeIcon(ChartBreakoutCircleIcon);
export const TrendingUp = createHugeIcon(AnalyticsUpIcon);
export const Trophy = createHugeIcon(TrophyIcon);
export const Truck = createHugeIcon(DeliveryTruck01Icon);
export const Undo = createHugeIcon(UndoIcon);
export const Undo2 = createHugeIcon(Undo02Icon);
export const Upload = createHugeIcon(Upload01Icon);
export const UploadCloud = createHugeIcon(CloudUploadIcon);
export const User = createHugeIcon(UserIcon);
export const UserPlus = createHugeIcon(UserAdd01Icon);
export const Users = createHugeIcon(UserGroupIcon);
export const Wallet = createHugeIcon(Wallet01Icon);
export const Wifi = createHugeIcon(WifiHighIcon);
export const WifiOff = createHugeIcon(WifiDisconnected01Icon);
export const X = createHugeIcon(Cancel01Icon);
export const XCircle = createHugeIcon(CancelCircleIcon);
export const Zap = createHugeIcon(FlashIcon);
