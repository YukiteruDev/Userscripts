; ==============================================================================
; AutoHotkey Script: Mouse Wheel Actions Based on Screen Position (Multi-Monitor)
; Version: 1.2
; ==============================================================================
; Description:
; 1. Top-Left Corner (Any Monitor): Scroll adjusts volume, Middle-Click mutes/unmutes.
; 2. Middle-Left/Right Edge (Virtual Screen Edges): Scroll acts as Page Up/Page Down.
; 3. Top Edge (Any Monitor, excluding corner): Scroll switches app tabs (Ctrl+PgUp/PgDn).
; ==============================================================================

; --- Requirements and Setup ---
#Requires AutoHotkey v1.1.33+ ; Recommend v1.1.33 or later for best compatibility
#Persistent                     ; Keep the script running
#SingleInstance force           ; Avoid running multiple copies
CoordMode, Mouse, Screen        ; *** Use Screen coordinates (essential for multi-monitor & screen edges) ***

; --- Configuration ---
ZoneWidth     := 50  ; Pixel width for left/right edge zones AND top-left corner width
TopZoneHeight := 30  ; Pixel height for the top zone (and top-left corner)
SideMarginY   := 50  ; Pixels from top/bottom edge to define the "middle" for side PageUp/Down zones

; --- Get Virtual Screen Dimensions (Used for Side Zones) ---
SysGet, VScreenLeft, 76    ; Left coordinate of the *entire* virtual screen
SysGet, VScreenTop, 77     ; Top coordinate of the *entire* virtual screen
SysGet, VScreenWidth, 78   ; Total width of the *entire* virtual screen
SysGet, VScreenHeight, 79  ; Total height of the *entire* virtual screen
VScreenRight := VScreenLeft + VScreenWidth
VScreenBottom := VScreenTop + VScreenHeight

; --- Side Zone Boundary Calculations (Based on *overall* Virtual Screen) ---
MidSide_MinY := VScreenTop + SideMarginY
MidSide_MaxY := VScreenBottom - SideMarginY
MidLeft_MaxX := VScreenLeft + ZoneWidth       ; Left edge of leftmost monitor
MidRight_MinX := VScreenRight - ZoneWidth     ; Right edge of rightmost monitor

; ==============================================================================
; Zone Checking Functions (Multi-Monitor Aware for Top Zones)
; ==============================================================================

IsMouseInTopLeft() {
    global ZoneWidth, TopZoneHeight ; Use configured global dimensions
    MouseGetPos, mouseX, mouseY     ; Get current mouse position (Screen coords)
    SysGet, MonitorCount, MonitorCount ; Find out how many monitors there are

    Loop, % MonitorCount          ; Loop through each monitor
    {
        SysGet, Mon, Monitor, %A_Index% ; Get boundaries for current monitor (index A_Index)
        ; MonLeft, MonTop, MonRight, MonBottom contain the coords for this monitor

        ; Calculate the Top-Left zone for *this* monitor
        ZoneMaxX := MonLeft + ZoneWidth      ; CORRECTED: Removed 'local'
        ZoneMaxY := MonTop + TopZoneHeight     ; CORRECTED: Removed 'local'

        ; Check if mouse is within this monitor's top-left zone
        if (mouseX >= MonLeft && mouseX < ZoneMaxX && mouseY >= MonTop && mouseY < ZoneMaxY)
        {
            ; ToolTip("Monitor " A_Index " TopLeft Zone ACTIVE") ; Debug line
            return True ; Mouse is in a top-left zone, exit function
        }
    }
    ; ToolTip("Monitor TopLeft Zone INACTIVE") ; Debug line
    return False ; Mouse was not in any monitor's top-left zone
}

IsMouseInTopEdgeForTabs() {
    global ZoneWidth, TopZoneHeight ; Use configured global dimensions
    MouseGetPos, mouseX, mouseY     ; Get current mouse position (Screen coords)
    SysGet, MonitorCount, MonitorCount ; Find out how many monitors there are

    Loop, % MonitorCount          ; Loop through each monitor
    {
        SysGet, Mon, Monitor, %A_Index% ; Get boundaries for current monitor
        ; MonLeft, MonTop, MonRight, MonBottom contain the coords for this monitor

        ; Define the Top Edge zone for *this* monitor (Y-coordinate)
        ZoneMinY := MonTop                   ; CORRECTED: Removed 'local'
        ZoneMaxY := MonTop + TopZoneHeight     ; CORRECTED: Removed 'local'

        ; Define the X-coordinates for the Top Edge zone, *excluding* the top-left corner area
        ZoneMinX := MonLeft + ZoneWidth      ; CORRECTED: Removed 'local'
        ZoneMaxX := MonRight               ; CORRECTED: Removed 'local'

        ; Check if mouse is within this monitor's top-edge-for-tabs zone
        if (mouseY >= ZoneMinY && mouseY < ZoneMaxY && mouseX >= ZoneMinX && mouseX < ZoneMaxX)
        {
            ; ToolTip("Monitor " A_Index " TopEdgeTabs Zone ACTIVE") ; Debug line
            return True ; Mouse is in a top-edge-for-tabs zone, exit function
        }
    }
    ; ToolTip("Monitor TopEdgeTabs Zone INACTIVE") ; Debug line
    return False ; Mouse was not in any monitor's top-edge-for-tabs zone
}

IsMouseInMiddleLeft() {
    ; This zone uses the *absolute left edge* of the entire virtual screen
    global MidLeft_MaxX, MidSide_MinY, MidSide_MaxY, VScreenLeft
    MouseGetPos, x, y
    ; Check if X is in the leftmost zone AND Y is in the middle vertical section
    return (x >= VScreenLeft && x < MidLeft_MaxX && y >= MidSide_MinY && y < MidSide_MaxY)
}

IsMouseInMiddleRight() {
    ; This zone uses the *absolute right edge* of the entire virtual screen
    global MidRight_MinX, MidSide_MinY, MidSide_MaxY, VScreenRight
    MouseGetPos, x, y
    ; Check if X is in the rightmost zone AND Y is in the middle vertical section
    return (x >= MidRight_MinX && x < VScreenRight && y >= MidSide_MinY && y < MidSide_MaxY)
}

; ==============================================================================
; Hotkeys - ORDER MATTERS (#If evaluated sequentially)
; ==============================================================================

; --- 1. Top-Left (Any Monitor): Volume Control ---
#If IsMouseInTopLeft()
WheelUp::Send {Volume_Up}     ; Use media key simulation
WheelDown::Send {Volume_Down}   ; Use media key simulation
MButton::Send {Volume_Mute}
#If

; --- 2. Top Edge (Any Monitor, excluding Top-Left): Tab Switching ---
; NOTE: This #If block is only checked if the `IsMouseInTopLeft()` check above fails.
#If IsMouseInTopEdgeForTabs()
WheelUp::Send ^{PgUp}   ; Send Ctrl+PageUp (Previous Tab)
WheelDown::Send ^{PgDn}  ; Send Ctrl+PageDown (Next Tab)
; MButton:: ; No action defined
#If

; --- 3. Middle-Left Edge (Virtual Screen): Page Up/Down ---
#If IsMouseInMiddleLeft()
WheelUp::Send {PgUp}
WheelDown::Send {PgDn}
; MButton:: ; No action defined
#If

; --- 4. Middle-Right Edge (Virtual Screen): Page Up/Down ---
#If IsMouseInMiddleRight()
WheelUp::Send {PgUp}
WheelDown::Send {PgDn}
; MButton:: ; No action defined
#If

; --- End of Context-Sensitive Hotkey Definitions ---

Return ; End of the auto-execute section

; ==============================================================================
; Tray Menu
; ==============================================================================
Menu, Tray, Icon, shell32.dll, 110
Menu, Tray, Tip, Mouse Zone Actions Script (v1.2) ; Updated version in tooltip
Menu, Tray, Add, Pause Script, PauseHandler
Menu, Tray, Add, Reload Script, ReloadHandler
Menu, Tray, Add, Exit Script, ExitHandler
Return

PauseHandler:
    Pause
    Menu, Tray, ToggleCheck, Pause Script
Return

ReloadHandler:
    Reload
Return

ExitHandler:
    ExitApp
Return

; ==============================================================================
; Debugging Tooltip (Uncomment the /* and */ lines to enable)
; ==============================================================================
/*
SetTimer, ShowDebugToolTip, 50 ; Update tooltip every 50ms
Return

ShowDebugToolTip:
    MouseGetPos, dbg_x, dbg_y
    ZoneTL := IsMouseInTopLeft() ? "YES" : "NO "
    ZoneTopTabs := IsMouseInTopEdgeForTabs() ? "YES" : "NO "
    ZoneMidL := IsMouseInMiddleLeft() ? "YES" : "NO "
    ZoneMidR := IsMouseInMiddleRight() ? "YES" : "NO "
    ToolTipText =
    ( LTrim Join C
        Screen X:%dbg_x% Y:%dbg_y%
        --------------------
        TopLeft (Vol): %ZoneTL%
        TopEdge (Tab): %ZoneTopTabs%
        MidLeft (Pg):  %ZoneMidL%
        MidRight(Pg):  %ZoneMidR%
    )
    ToolTip, %ToolTipText%, ,, 1 ; Use ID 1 for this tooltip
Return

OnExit, RemoveDebugToolTip
RemoveDebugToolTip:
    ToolTip,,,, 1
ExitApp
*/
