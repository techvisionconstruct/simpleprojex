"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Cookie from "js-cookie";
import { 
  Avatar, 
  AvatarFallback, 
  AvatarImage,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuItem
} from "@/components/shared";
import { 
  FileText, 
  Layers, 
  File, 
  ChevronLeft,
  ChevronRight,
  Settings,
  LogOut,
  ChevronDown
} from "lucide-react";
import { useUser } from "../../contexts/user-context";

const navItems = [
  {
    section: "main",
    items: [
      // { 
      //   icon: Home, 
      //   label: "Dashboard", 
      //   href: "/dashboard" 
      // },
    ]
  },
  {
    section: "primary",
    items: [
      { 
        icon: File, 
        label: "Templates", 
        href: "/v1/templates" 
      },
      { 
        icon: Layers, 
        label: "Proposals", 
        href: "/v1/proposals" 
      },
      { 
        icon: FileText, 
        label: "Contracts", 
        href: "/v1/contracts" 
      },
    ]
  },
  {
    section: "utility",
    items: [
      // { 
      //   icon: Variable, 
      //   label: "Variables", 
      //   href: "/variables" 
      // },
      // { 
      //   icon: Calculator, 
      //   label: "Categories", 
      //   href: "/categories" 
      // },
      // { 
      //   icon: FlaskConical, 
      //   label: "Elements", 
      //   href: "/elements" 
      // },
    ]
  }
];

const SIDEBAR_EXPANDED_WIDTH = "18rem";
const SIDEBAR_COLLAPSED_WIDTH = "6.5rem"; 
const ICON_LEFT_POSITION = "1.75rem"; 

export function Sidenav() {
  const pathname = usePathname();
  const router = useRouter();
  const [activeItem, setActiveItem] = useState("");
  const [hoverItem, setHoverItem] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ 
    top: 0, 
    item: null as string | null,
    windowHeight: typeof window !== 'undefined' ? window.innerHeight : 0 
  });
  const { user, isLoading, error } = useUser();
  const [avatarFallback, setAvatarFallback] = useState('');
  
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      setTooltipPosition(prev => ({
        ...prev,
        windowHeight: window.innerHeight
      }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Set avatar fallback only on client-side to prevent hydration mismatch
  useEffect(() => {
    if (user?.username) {
      setAvatarFallback(user.username[0].toUpperCase());
    }
  }, [user?.username]);

  useEffect(() => {
    const currentPath = pathname || "/dashboard";
    
    const allItems = navItems.flatMap(section => section.items);
    const active = allItems.find(item => currentPath.startsWith(item.href))?.label || "";
    
    setActiveItem(active);
  }, [pathname]);

  const sidebarVariants = {
    expanded: { 
      width: SIDEBAR_EXPANDED_WIDTH,
      borderRadius: "16px",
      transition: { 
        width: { duration: 0.18, ease: "easeInOut" }, 
        borderRadius: { duration: 0.12 }
      }
    },
    collapsed: { 
      width: SIDEBAR_COLLAPSED_WIDTH,
      borderRadius: "16px",
      transition: { 
        width: { duration: 0.18, ease: "easeInOut" }, 
        borderRadius: { duration: 0.12 }
      }
    }
  };

  const handleItemHover = (item: string, e: React.MouseEvent) => {
    if (!isCollapsed) return;
    
    const targetElement = e.currentTarget;
    const rect = targetElement.getBoundingClientRect();
    
    setTooltipPosition({ 
      top: rect.top + (rect.height / 2) - 24, 
      item: item,
      windowHeight: window.innerHeight
    });
    setHoverItem(item);
  };

  const handleLogoHover = (isHovering: boolean, e?: React.MouseEvent) => {
    if (!isCollapsed) return;
    
    if (isHovering && e) {  
      const targetElement = e.currentTarget;
      const rect = targetElement.getBoundingClientRect();
      setTooltipPosition({ 
        top: rect.top + (rect.height / 2) - 24, 
        item: "logo",
        windowHeight: window.innerHeight
      });
      setHoverItem("logo");
    } else {
      setHoverItem(null);
    }
  };

  const handleProfileHover = (isHovering: boolean, e?: React.MouseEvent) => {
    if (!isCollapsed) return;
    
    if (isHovering && e) {  
      const targetElement = e.currentTarget;
      const rect = targetElement.getBoundingClientRect();
      setTooltipPosition({ 
        top: rect.top + (rect.height / 2) + 10, 
        item: "profile",
        windowHeight: window.innerHeight
      });
      setHoverItem("profile");
    } else {
      setHoverItem(null);
    }
  };

  const isProfileTooltipNearBottom = 
    hoverItem === "profile" && 
    tooltipPosition.top > tooltipPosition.windowHeight - 100; 

  const getIconPosition = () => {
    return isCollapsed ? "50%" : ICON_LEFT_POSITION;
  };

  const getIconTransform = () => {
    return isCollapsed ? "translateX(-50%) translateY(-50%)" : "translateY(-50%)";
  };

  const handleLogout = () => {
    Cookie.remove("auth-token", { path: "/" });
    router.push("/login");
  };

  return (
    <div className="relative h-screen" ref={navRef}>
      <motion.div 
        className="h-screen bg-sidebar flex flex-col py-6 border-r border-sidebar-border shadow-sm relative overflow-hidden"
        variants={sidebarVariants}
        initial="expanded"
        animate={isCollapsed ? "collapsed" : "expanded"}
      >
        <div className="h-20 mb-12 relative">
          <div 
            className="absolute z-20 transition-all duration-400 ease-in-out"
            style={{
              left: getIconPosition(),
              top: "50%",
              transform: getIconTransform()
            }}
            onMouseEnter={(e) => handleLogoHover(true, e)}
            onMouseLeave={() => handleLogoHover(false)}
          >
            <Image 
              src="/icons/logo.svg" 
              alt="Projex Logo" 
              width={58} 
              height={58} 
              className="object-contain"
            />
          </div>
          
          {/* Fixed SIMPLE PROJEX layout */}
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div 
                className="absolute top-1/2 -translate-y-1/2 overflow-visible"
                style={{ 
                  left: "calc(" + ICON_LEFT_POSITION + " + 64px)",
                  willChange: "transform, opacity",
                  transformOrigin: "left"
                }}
                initial={{ opacity: 0, x: -10 }}
                animate={{ 
                  opacity: 1, 
                  x: 0,
                  transition: { 
                    opacity: { duration: 0.13, delay: 0.04 },
                    x: { duration: 0.13, delay: 0.04 }
                  }
                }}
                exit={{ 
                  opacity: 0, 
                  x: -10,
                  transition: { duration: 0.09, ease: "easeInOut" } 
                }}
              >
                <div 
                  style={{ 
                    fontFamily: "'DM Sans', sans-serif", 
                    fontSize: "10pt",
                    letterSpacing: "0",
                    lineHeight: 0.9
                  }} 
                  className="text-muted-foreground uppercase tracking-wide mb-0.5"
                >
                  SIMPLE
                </div>
                <div 
                  style={{ 
                    fontFamily: "'DM Sans', sans-serif", 
                    fontSize: "20pt", 
                    letterSpacing: "0.09rem",
                    lineHeight: "0.85"
                  }} 
                  className="font-bold text-sidebar-foreground uppercase"
                >
                  PROJEX
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Navigation items by section */}
        <nav className="flex-1 flex flex-col px-2 overflow-y-auto">
          {navItems.map((section, index) => (
            <motion.div 
              key={section.section} 
              className="mb-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                transition: { 
                  delay: index * 0.06,
                  duration: 0.13
                }
              }}
            >
              {section.items.map((item) => (
                <NavItem 
                  key={item.label}
                  icon={item.icon}
                  label={item.label}
                  href={item.href}
                  isActive={activeItem === item.label}
                  isHovered={hoverItem === item.label}
                  isCollapsed={isCollapsed}
                  onHover={(e) => handleItemHover(item.label, e)}
                  onLeave={() => setHoverItem(null)}
                  onClick={() => setActiveItem(item.label)}
                  iconPosition={getIconPosition()}
                  iconTransform={getIconTransform()}
                />
              ))}
            </motion.div>
          ))}
        </nav>

        {/* User profile section with dropdown menu - Now fully clickable box */}
        <div className="h-16 border-t border-sidebar-border pt-3 px-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn(
                "w-full flex items-center relative rounded-md px-2 py-1.5",
                "transition-colors duration-200 hover:bg-sidebar-accent text-left",
                "cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              )}>
                <div className="flex items-center w-full">
                  <div 
                    className={cn(
                      "transition-all duration-400 ease-in-out",
                      isCollapsed ? "mx-auto" : ""
                    )}
                  >
                    <Avatar className="h-9 w-9 ring-2 ring-sidebar-ring/20 hover:ring-sidebar-ring/40 transition-all">
                      <AvatarFallback className="font-medium text-sidebar-foreground uppercase">{avatarFallback}</AvatarFallback>
                    </Avatar>
                  </div>
                  
                  <AnimatePresence mode="wait">
                    {!isCollapsed && (
                      <motion.div 
                        className="flex flex-col ml-2"
                        style={{ fontFamily: "'Open Sans', sans-serif" }}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ 
                          opacity: 1, 
                          x: 0,
                          transition: { 
                            opacity: { duration: 0.13, delay: 0.04 },
                            x: { duration: 0.13, delay: 0.04 }
                          }
                        }}
                        exit={{ 
                          opacity: 0, 
                          x: -10,
                          transition: { duration: 0.09, ease: "easeInOut" } 
                        }}
                      >
                        <div className="font-medium text-sm text-sidebar-foreground">{user?.username}</div>
                        <div className="text-xs text-muted-foreground">{user?.email}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {/* Dropdown indicator */}
                  {!isCollapsed && (
                    <ChevronDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                  )}
                </div>
              </button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem className="w-full flex items-center cursor-pointer hover:bg-accent focus:bg-accent">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.username}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="w-full flex items-center cursor-pointer hover:bg-accent">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="w-full flex items-center cursor-pointer hover:bg-accent text-red-600" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.div>

      {/* Toggle button - Properly positioned at the middle right edge */}
      <motion.button
        className="absolute top-1/2 -translate-y-1/2 right-0 translate-x-1/2 w-8 h-8 bg-sidebar border-2 border-sidebar-border rounded-full flex items-center justify-center shadow-lg z-50 hover:bg-sidebar-accent"
        onClick={() => setIsCollapsed(!isCollapsed)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.2 }}
        animate={{
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)"
        }}
        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? 
          <ChevronRight size={16} className="text-sidebar-foreground" /> : 
          <ChevronLeft size={16} className="text-sidebar-foreground" />
        }
      </motion.button>
      
      {/* Tooltip positioned OUTSIDE the sidebar - Like the toggle button */}
      <AnimatePresence>
        {isCollapsed && hoverItem && (
          <motion.div
            className="fixed z-[100] px-3 py-1.5 bg-popover text-popover-foreground rounded-md shadow-md whitespace-nowrap"
            style={{ 
              left: `calc(${SIDEBAR_COLLAPSED_WIDTH} + 8px)`, // Position to the right of collapsed sidebar
              // For profile near bottom, position tooltip above instead of centered
              top: isProfileTooltipNearBottom ? tooltipPosition.top - 40 : tooltipPosition.top,
              transform: isProfileTooltipNearBottom ? 'translateY(-100%)' : 'translateY(-50%)',
            }}
            initial={{ opacity: 0, x: -5, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -5, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {/* Arrow pointing to the hovered item - Only show for non-profile items */}
            {hoverItem !== "profile" && (
              <div 
                className={cn(
                  "absolute w-2 h-2 bg-popover rotate-45",
                  isProfileTooltipNearBottom ? "-bottom-1 left-3" : "-left-1 top-1/2 -mt-1"
                )} 
              />
            )}
            
            {/* Different tooltip content based on hovered item */}
            <div className="relative z-10">
              {hoverItem === "logo" && (
                <span className="font-medium">Simple Projex</span>
              )}
              
              {hoverItem === "profile" && (
                <>
                  <div className="font-medium">Admin</div>
                  <div className="text-xs text-muted-foreground">System</div>
                </>
              )}
              
              {hoverItem !== "logo" && hoverItem !== "profile" && (
                <span className="font-medium">{hoverItem}</span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Navigation item component with dynamic positioning for icons
function NavItem({ 
  icon: Icon, 
  label, 
  href, 
  isActive, 
  isHovered,
  isCollapsed,
  onHover,
  onLeave,
  onClick,
  iconPosition,
  iconTransform
}: { 
  icon: React.ElementType; 
  label: string; 
  href: string; 
  isActive: boolean; 
  isHovered: boolean;
  isCollapsed: boolean;
  onHover: (e: React.MouseEvent) => void;
  onLeave: () => void;
  onClick: () => void;
  iconPosition: string;
  iconTransform: string;
}) {
  // Local hover state to ensure we can track hover independently in each state
  const [isLocalHover, setIsLocalHover] = useState(false);
  
  // Handle mouse enter with both parent and local hover states
  const handleMouseEnter = (e: React.MouseEvent) => {
    setIsLocalHover(true);
    onHover(e);
  };
  
  // Handle mouse leave with both parent and local hover states
  const handleMouseLeave = () => {
    setIsLocalHover(false);
    onLeave();
  };

  return (
    <Link href={href} onClick={onClick} className="block relative h-12">
      <motion.div
        className={cn(
          "relative w-full h-full",
          // Only apply rounded corners to nav items in expanded state
          !isCollapsed && "rounded-[30px]",
          "transition-all duration-300 ease-in-out",
          // Only apply background to active items in expanded state
          !isCollapsed && isActive ? "font-bold bg-sidebar-accent" : ""
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        // Apply hover effects to both expanded and collapsed states
        whileHover={!isCollapsed ? 
          { 
            backgroundColor: "var(--sidebar-accent)",
            transition: { duration: 0.09, ease: "easeInOut" }
          } : {}}
        animate={{
          backgroundColor: !isCollapsed && isActive ? "var(--sidebar-accent)" : "transparent",
        }}
        transition={{
          duration: 0.09,
          backgroundColor: { duration: 0.09 }
        }}
      >
        {/* Icon container with dynamic positioning based on sidebar state */}
        <div 
          className="absolute top-1/2 z-10 transition-all duration-400 ease-in-out"
          style={{ 
            left: iconPosition,
            transform: iconTransform
          }}
        >
          {/* Circle background directly around the icon in collapsed state */}
          {isCollapsed && (isActive || isLocalHover) && (
            <div 
              className="absolute inset-0 z-0 rounded-full"
              style={{
                width: "38px",
                height: "38px",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                backgroundColor: isActive ? "var(--sidebar-accent)" : "var(--sidebar-accent)",
              }}
            />
          )}
          
          {/* Icon element with animations */}
          <motion.div
            className="relative z-10"
            initial={false}
            animate={{ 
              scale: isActive || isHovered || isLocalHover ? 1.1 : 1,
              rotate: isHovered || isLocalHover ? 5 : 0,
              opacity: 1
            }}
            transition={{ 
              type: "spring", 
              stiffness: 600, 
              damping: 22,
              opacity: { duration: 0 }
            }}
          >
            <Icon 
              size={22} 
              className={cn(
                "transition-colors",
                isActive 
                  ? "text-sidebar-foreground" 
                  : "text-muted-foreground"
              )} 
            />
          </motion.div>
          
          {/* Active indicator dot */}
          {isActive && (
            <motion.div 
              className="absolute -top-1.5 -right-1.5 w-2 h-2 rounded-full bg-sidebar-primary"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                type: "spring", 
                stiffness: 600, 
                damping: 22 
              }}
            />
          )}
        </div>
        
        {/* Label absolutely positioned for clean animation */}
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div 
              className="absolute top-1/2 -translate-y-1/2"
              style={{ 
                left: "calc(" + ICON_LEFT_POSITION + " + 40px)",
                fontFamily: "'Open Sans', sans-serif", 
                fontSize: "16px",
              }}
              initial={{ opacity: 0, x: -10 }}
              animate={{ 
                opacity: 1, 
                x: 0,
                transition: { 
                  opacity: { duration: 0.13, delay: 0.04 },
                  x: { duration: 0.13, delay: 0.04 },
                  ease: "easeInOut"
                }
              }}
              exit={{ 
                opacity: 0, 
                x: -10,
                transition: { duration: 0.09, ease: "easeInOut" } 
              }}
            >
              <span className={cn(
                "whitespace-nowrap",
                isActive ? "text-sidebar-foreground font-semibold" : "text-muted-foreground"
              )}>
                {label}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </Link>
  );
}