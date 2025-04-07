; ==============================================================================
; AutoHotkey Script: Mouse Wheel Actions Based on Screen Position (Multi-Monitor)
; ==============================================================================
; Description:
; 1. Top-Left Corner: Scroll adjusts volume, Middle-Click mutes/unmutes.
; 2. Middle-Left/Right Edge: Scroll acts as Page Up/Page Down.
; 3. Top Edge (excluding corner): Scroll switches application tabs (Ctrl+PgUp/PgDn).
; ==============================================================================

#Persistent          ; Keep the script running
#SingleInstance force ; Avoid running multiple copies
CoordMode, Mouse, Screen ; *** Use Screen coordinates (essential for multi-monitor & screen edges) ***

; --- Configuration ---
ZoneWidth     := 50  ; Pixel width for left/right edge zones
TopZoneHeight := 30  ; Pixel height for the top zone (and top-left corner)
SideMarginY   := 50  ; Pixels from top/bottom edge to define the "middle" for side PageUp/Down zones

; --- Get Virtual Screen Dimensions (handles multiple monitors automatically) ---
SysGet, VScreenLeft, 76    ; Left coordinate of the virtual screen
SysGet, VScreenTop, 77     ; Top coordinate of the virtual screen
SysGet, VScreenWidth, 78   ; Total width of the virtual screen
SysGet, VScreenHeight, 79  ; Total height of the virtual screen
VScreenRight := VScreenLeft + VScreenWidth
VScreenBottom := VScreenTop + VScreenHeight

; --- Zone Boundary Calculations ---
; Note: Calculations based on the virtual screen encompassing all monitors.

; Top-Left corner zone for Volume
TopLeft_MaxX := VScreenLeft + ZoneWidth
TopLeft_MaxY := VScreenTop + TopZoneHeight

; Top edge zone for Tabs (starts AFTER the top-left volume zone)
TopEdge_MinY := VScreenTop
TopEdge_MaxY := VScreenTop + TopZoneHeight
TopEdge_MinX_ForTabs := VScreenLeft + ZoneWidth ; Don't overlap with volume zone's X range

; Middle vertical section boundaries for Page Up/Down zones
MidSide_MinY := VScreenTop + SideMarginY
MidSide_MaxY := VScreenBottom - SideMarginY

; Middle-Left edge zone for Page Up/Down
MidLeft_MaxX := VScreenLeft + ZoneWidth

; Middle-Right edge zone for Page Up/Down
MidRight_MinX := VScreenRight - ZoneWidth

; ==============================================================================
; Zone Checking Functions
; ==============================================================================

IsMouseInTopLeft() {
    global TopLeft_MaxX, TopLeft_MaxY, VScreenLeft, VScreenTop
    MouseGetPos, x, y
    ; ToolTip("TL Check: X%x% Y%y% vs MaxX%TopLeft_MaxX% MaxY%TopLeft_MaxY%") ; Debug line
    return (x >= VScreenLeft && x < TopLeft_MaxX && y >= VScreenTop && y < TopLeft_MaxY)
}

IsMouseInTopEdgeForTabs() {
    global TopEdge_MinY, TopEdge_MaxY, TopEdge_MinX_ForTabs, VScreenRight
    MouseGetPos, x, y
    ; Check if Y is in the top zone AND X is to the right of the top-left volume zone
    ; ToolTip("TT Check: X%x% Y%y% vs MinY%TopEdge_MinY% MaxY%TopEdge_MaxY% MinX%TopEdge_MinX_ForTabs%") ; Debug line
    return (y >= TopEdge_MinY && y < TopEdge_MaxY && x >= TopEdge_MinX_ForTabs && x < VScreenRight)
}

IsMouseInMiddleLeft() {
    global MidLeft_MaxX, MidSide_MinY, MidSide_MaxY, VScreenLeft
    MouseGetPos, x, y
    ; Check if X is in the left zone AND Y is in the middle vertical section
    ; ToolTip("ML Check: X%x% Y%y% vs MaxX%MidLeft_MaxX% MinY%MidSide_MinY% MaxY%MidSide_MaxY%") ; Debug line
    return (x >= VScreenLeft && x < MidLeft_MaxX && y >= MidSide_MinY && y < MidSide_MaxY)
}

IsMouseInMiddleRight() {
    global MidRight_MinX, MidSide_MinY, MidSide_MaxY, VScreenRight
    MouseGetPos, x, y
    ; Check if X is in the right zone AND Y is in the middle vertical section
    ; ToolTip("MR Check: X%x% Y%y% vs MinX%MidRight_MinX% MinY%MidSide_MinY% MaxY%MidSide_MaxY%") ; Debug line
    return (x >= MidRight_MinX && x < VScreenRight && y >= MidSide_MinY && y < MidSide_MaxY)
}

; ==============================================================================
; Hotkeys - ORDER MATTERS due to potentially overlapping zones (#If evaluated sequentially)
; ==============================================================================

; --- 1. Top-Left: Volume Control ---
#If IsMouseInTopLeft()
;WheelUp::SoundSet, +2  ; Commented out the old line
;WheelDown::SoundSet, -2 ; Commented out the old line
WheelUp::Send {Volume_Up}    ; Simulate pressing the Volume Up media key
WheelDown::Send {Volume_Down}  ; Simulate pressing the Volume Down media key
MButton::Send {Volume_Mute}   ; Keep the mute toggle
#If

; --- 2. Top Edge (excluding Top-Left): Tab Switching ---
#If IsMouseInTopEdgeForTabs()
WheelUp::Send ^{PgUp}   ; Send Ctrl+PageUp (Previous Tab in many apps like browsers)
WheelDown::Send ^{PgDn}  ; Send Ctrl+PageDown (Next Tab in many apps like browsers)
; MButton:: ; No action defined for middle click here in the request
#If

; --- 3. Middle-Left Edge: Page Up/Down ---
#If IsMouseInMiddleLeft()
WheelUp::Send {PgUp}
WheelDown::Send {PgDn}
; MButton:: ; No action defined here in the request
#If

; --- 4. Middle-Right Edge: Page Up/Down ---
#If IsMouseInMiddleRight()
WheelUp::Send {PgUp}
WheelDown::Send {PgDn}
; MButton:: ; No action defined here in the request
#If

; --- End of Context-Sensitive Hotkey Definitions ---

Return ; End of the auto-execute section of the script

; ==============================================================================
; Optional: Add a tray icon menu to pause/exit the script easily
; ==============================================================================
Menu, Tray, Icon, shell32.dll, 110 ; Use a mouse icon (or choose another index/file)
Menu, Tray, Tip, Mouse Zone Actions Script ; Tooltip for the tray icon
Menu, Tray, Add, Pause Script, PauseHandler
Menu, Tray, Add, Reload Script, ReloadHandler
Menu, Tray, Add, Exit Script, ExitHandler
Return ; End auto-execute for menu definitions

PauseHandler:
    Pause ; Toggles pause state
    If (A_IsPaused)
        Menu, Tray, Check, Pause Script
    Else
        Menu, Tray, Uncheck, Pause Script
Return

ReloadHandler:
    Reload
Return

ExitHandler:
    ExitApp
Return

; ==============================================================================
; Debugging Tooltip (Uncomment the /* and */ lines to enable)
; Shows mouse coordinates and active zone status. Useful for adjusting Zone sizes.
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

; When script exits, remove the debug tooltip if it's showing
OnExit, RemoveDebugToolTip
RemoveDebugToolTip:
    ToolTip,,,, 1
ExitApp ; Ensure script truly exits
*/