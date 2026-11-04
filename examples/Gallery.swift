import Hugsy
import SwiftUI

@main struct HugsyGallery: App {
  var body: some Scene {
    WindowGroup { Gallery().frame(minWidth: 720, minHeight: 640) }
  }
}

private struct SampleCard: Identifiable {
  let id: String
  let color: Color
}

private struct Gallery: View {
  @State private var selection = "Overview"
  @State private var sidebar = "inbox"
  @State private var paletteOpen = false
  @State private var toasts = HugsyToasts()
  @State private var status = "Ready"

  var body: some View {
    ScrollView {
      VStack(spacing: 28) {
        Text("hugsy / motion lab").font(.largeTitle.bold())
        HugsyFluidTabs(tabs: ["Overview", "Activity", "Settings"], selection: $selection)
        HStack(alignment: .top, spacing: 24) {
          HugsyAnimatedSidebar(
            title: "Workspace",
            items: [
              .init(id: "inbox", title: "Inbox", symbol: "tray"),
              .init(id: "projects", title: "Projects", symbol: "square.stack"),
              .init(id: "archive", title: "Archive", symbol: "archivebox"),
            ], selection: $sidebar
          ).frame(height: 240)
          HugsyCardStack(items: [
            SampleCard(id: "Build something good.", color: .purple),
            SampleCard(id: "Make it yours.", color: .blue),
            SampleCard(id: "Keep exploring.", color: .orange),
          ]) { card in
            Text(card.id).font(.title.bold()).frame(height: 180).frame(maxWidth: .infinity)
              .foregroundStyle(.white).background(
                card.color.gradient, in: RoundedRectangle(cornerRadius: 20))
          }.frame(width: 280)
        }
        HugsyMagnifyingDock(items: [
          .init(id: "files", title: "Files", symbol: "folder.fill", color: .blue) {
            status = "Files opened"
          },
          .init(id: "music", title: "Music", symbol: "music.note", color: .pink) {
            status = "Music opened"
          },
          .init(id: "notes", title: "Notes", symbol: "note.text", color: .orange) {
            status = "Notes opened"
          },
        ])
        HStack {
          Button("Open command palette") { paletteOpen = true }.keyboardShortcut("k")
          Button("Show toast") { toasts.show("Your changes are saved") }
        }
        Text(status).foregroundStyle(.secondary)
        HugsyToastStack(toasts: toasts)
      }.padding(36)
    }
    .sheet(isPresented: $paletteOpen) {
      HugsyCommandPalette(commands: [
        .init(id: "new", title: "Create project", symbol: "plus") { status = "Project created" },
        .init(id: "save", title: "Save changes", symbol: "square.and.arrow.down") {
          toasts.show("Changes saved")
        },
      ]) { paletteOpen = false }
    }
  }
}
