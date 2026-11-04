import SwiftUI

#if os(iOS)
  import UIKit
#endif

#if SWIFT_PACKAGE
  import Hugsy
#endif

@main struct HugsyGallery: App {
  var body: some Scene {
    WindowGroup {
      NativeGallery(component: Self.component)
        #if os(macOS)
          .frame(width: 390, height: 844)
        #endif
    }
  }

  private static var component: String {
    let arguments = ProcessInfo.processInfo.arguments
    guard let index = arguments.firstIndex(of: "--component"), arguments.indices.contains(index + 1)
    else { return "expanding-cards" }
    return arguments[index + 1]
  }
}

private struct Story: Identifiable {
  let id: String
  let title: String
  let subtitle: String
  let colors: [Color]
}

private let stories = [
  Story(
    id: "still", title: "A slower\nkind of Sunday.", subtitle: "THE ART OF DOING LESS",
    colors: [Color(red: 0.89, green: 0.77, blue: 0.63), Color(red: 0.70, green: 0.62, blue: 0.51)]),
  Story(
    id: "after", title: "After the\nlast light.", subtitle: "NOTES FROM THE CITY",
    colors: [Color(red: 0.42, green: 0.36, blue: 0.56), Color(red: 0.25, green: 0.22, blue: 0.38)]),
]

private struct NativeGallery: View {
  let component: String
  @State private var selected: String?
  @State private var tab = "For you"
  @State private var menuOpen = true
  @State private var sheetPosition: HugsySheetPosition = .compact
  @State private var toasts = HugsyToasts()
  @State private var status = "Made for a little more feeling."
  @State private var captureOffset: CGFloat = 0

  var body: some View {
    ZStack {
      Color(red: 0.97, green: 0.96, blue: 0.94).ignoresSafeArea()
      VStack(alignment: .leading, spacing: 26) {
        HStack {
          Text("studio").font(.system(size: 20, weight: .semibold, design: .rounded)).tracking(-0.7)
          Spacer()
          Image(systemName: "circle.grid.2x2").font(.system(size: 20, weight: .regular))
        }.padding(.top, 14)
        VStack(alignment: .leading, spacing: 10) {
          Text("A LITTLE COLLECTION OF GOOD THINGS").font(
            .system(size: 8, weight: .medium, design: .monospaced)
          ).tracking(1.1).foregroundStyle(.secondary)
          Text(title).font(.system(size: 38, weight: .medium)).tracking(-1.7).lineSpacing(-2)
        }
        showcase
        Spacer(minLength: 0)
        HStack {
          Image(systemName: "square.stack.3d.up").font(.system(size: 18))
          Spacer()
          Text("Explore").font(.system(size: 11, weight: .medium))
          Spacer()
          Image(systemName: "bookmark").font(.system(size: 18))
        }.foregroundStyle(Color(red: 0.34, green: 0.35, blue: 0.31)).padding(.horizontal, 25)
          .padding(.vertical, 14)
      }
      .padding(.horizontal, 24)
      .foregroundStyle(Color(red: 0.13, green: 0.14, blue: 0.12))
    }
    .task { await recordSequence() }
  }

  private var title: String {
    switch component {
    case "morphing-sheet": "Let the moment\nopen up."
    case "radial-menu": "A little space\nfor possibility."
    case "toast-stack": "Good things,\nright on time."
    case "fluid-tabs": "Find your\npoint of view."
    case "stretchy-header": "Take the\nscenic route."
    default: "Stay curious.\nGo a little deeper."
    }
  }

  @ViewBuilder private var showcase: some View {
    switch component {
    case "morphing-sheet":
      Spacer(minLength: 0)
      HugsyMorphingSheet(position: $sheetPosition, compactHeight: 215, expandedHeight: 430) {
        state in
        VStack(spacing: 20) {
          Artwork(colors: stories[1].colors).frame(height: state == .compact ? 68 : 190).clipShape(
            RoundedRectangle(cornerRadius: 22))
          HStack {
            VStack(alignment: .leading, spacing: 3) {
              Text("A quiet place").font(.system(size: 17, weight: .medium))
              Text("Sunday, somewhere").font(.system(size: 11)).foregroundStyle(.secondary)
            }
            Spacer()
            Image(systemName: "pause.fill").font(.system(size: 24))
          }
          if state == .expanded {
            Capsule().fill(.primary.opacity(0.12)).frame(height: 3)
            HStack(spacing: 45) {
              Image(systemName: "backward.end.fill")
              Image(systemName: "pause.circle.fill").font(.system(size: 45))
              Image(systemName: "forward.end.fill")
            }
          }
        }.padding(.horizontal, 24)
      }
    case "radial-menu":
      Artwork(colors: stories[1].colors).frame(height: 185).clipShape(
        RoundedRectangle(cornerRadius: 28))
      Text(status).font(.system(size: 12)).foregroundStyle(.secondary)
      HugsyRadialMenu(
        actions: [
          .init(id: "photo", title: "Add photo", symbol: "camera") { status = "Photo added" },
          .init(id: "note", title: "New note", symbol: "square.and.pencil") {
            status = "Note created"
          },
          .init(id: "link", title: "Save link", symbol: "link") { status = "Link saved" },
        ], isExpanded: $menuOpen
      ).tint(Color(red: 0.32, green: 0.29, blue: 0.49))
        .frame(maxWidth: .infinity)
    case "toast-stack":
      Artwork(colors: stories[0].colors).frame(height: 180).clipShape(
        RoundedRectangle(cornerRadius: 28))
      Button {
        toasts.show("Saved to your collection")
      } label: {
        Text("Save a little inspiration").font(.system(size: 12, weight: .medium)).frame(
          maxWidth: .infinity
        ).padding(16)
          .background(.primary.opacity(0.06), in: Capsule())
      }.buttonStyle(.plain)
      HugsyToastStack(toasts: toasts)
    case "fluid-tabs":
      HugsyFluidTabs(tabs: ["For you", "Following", "Saved"], selection: $tab)
      Artwork(colors: tab == "Following" ? stories[1].colors : stories[0].colors)
        .frame(height: 280).clipShape(RoundedRectangle(cornerRadius: 28))
      VStack(alignment: .leading, spacing: 8) {
        Text(tab == "Saved" ? "Keep the good ones." : "A new perspective.").font(
          .system(size: 25, weight: .medium)
        ).tracking(-0.8)
        Text("Stories worth making a little room for.").font(.system(size: 12)).foregroundStyle(
          .secondary)
      }
    case "stretchy-header":
      HugsyStretchyHeader(height: 250) {
        Artwork(colors: stories[0].colors)
      } content: {
        VStack(alignment: .leading, spacing: 20) {
          Text("The places\nin between.").font(.system(size: 30, weight: .medium)).tracking(-1)
          Text(
            "Some days ask for a slower pace. A different path. A little more room to notice what was here all along."
          ).font(.system(size: 14)).lineSpacing(5).foregroundStyle(.secondary)
          ForEach(0..<5) { _ in
            RoundedRectangle(cornerRadius: 8).fill(.primary.opacity(0.05)).frame(height: 55)
          }
        }.padding(24)
          #if os(iOS)
            .background(PreviewScrollDriver(offset: captureOffset))
          #endif
      }.clipShape(RoundedRectangle(cornerRadius: 28))
    default:
      HugsyExpandingCards(
        items: stories, selection: $selected, cardHeight: 182, expandedHeight: 430
      ) { story, expanded in
        ZStack(alignment: .bottomLeading) {
          Artwork(colors: story.colors)
          VStack(alignment: .leading, spacing: 10) {
            Text(story.subtitle).font(.system(size: 8, weight: .medium, design: .monospaced))
              .tracking(1)
            Text(story.title).font(.system(size: expanded ? 37 : 27, weight: .medium)).tracking(-1)
            if expanded {
              Text(
                "Some things are better when you give them a little more space. This is one of them."
              )
              .font(.system(size: 14)).lineSpacing(4).padding(.top, 16)
            }
          }.padding(24).foregroundStyle(
            story.id == "still" ? Color(red: 0.18, green: 0.16, blue: 0.13) : .white)
        }
      }
      if selected == nil {
        HStack {
          Text("A FEW THINGS WE LOVE")
          Spacer()
          Text("02")
        }
        .font(.system(size: 8, design: .monospaced)).tracking(1).foregroundStyle(.secondary)
      }
    }
  }

  private func recordSequence() async {
    guard ProcessInfo.processInfo.arguments.contains("--record") else {
      if component == "morphing-sheet" { sheetPosition = .expanded }
      if component == "toast-stack" {
        toasts.show("A little inspiration, saved", duration: .seconds(60))
      }
      return
    }
    do {
      for step in 0..<8 {
        try await Task.sleep(for: .seconds(1.5))
        switch component {
        case "morphing-sheet": sheetPosition = step.isMultiple(of: 2) ? .expanded : .compact
        case "radial-menu": menuOpen.toggle()
        case "fluid-tabs": tab = ["Following", "Saved", "For you"][step % 3]
        case "toast-stack":
          toasts.show(
            ["Saved to your collection", "Your workspace is in sync", "A new note, just for you"][
              step % 3])
        case "stretchy-header": captureOffset = step.isMultiple(of: 2) ? -150 : 0
        default: selected = step.isMultiple(of: 2) ? stories[step % stories.count].id : nil
        }
      }
    } catch { return }
  }
}

#if os(iOS)
  private struct PreviewScrollDriver: UIViewRepresentable {
    let offset: CGFloat
    final class Coordinator { var offset = CGFloat.nan }
    func makeCoordinator() -> Coordinator { Coordinator() }
    func makeUIView(context: Context) -> UIView { UIView(frame: .zero) }
    func updateUIView(_ uiView: UIView, context: Context) {
      guard context.coordinator.offset != offset else { return }
      context.coordinator.offset = offset
      DispatchQueue.main.async {
        var ancestor = uiView.superview
        while let view = ancestor {
          if let scroll = view as? UIScrollView {
            scroll.setContentOffset(
              CGPoint(x: 0, y: offset - scroll.adjustedContentInset.top), animated: true)
            return
          }
          ancestor = view.superview
        }
      }
    }
  }
#endif

private struct Artwork: View {
  let colors: [Color]

  var body: some View {
    GeometryReader { proxy in
      ZStack {
        LinearGradient(colors: colors, startPoint: .topLeading, endPoint: .bottomTrailing)
        Circle().fill(.white.opacity(0.12)).frame(width: proxy.size.width * 0.8)
          .offset(x: proxy.size.width * 0.28, y: -proxy.size.height * 0.2)
        ForEach(0..<7) { index in
          Ellipse().stroke(.white.opacity(0.22 - Double(index) * 0.023), lineWidth: 1)
            .frame(
              width: proxy.size.width * 1.1 + CGFloat(index) * 28,
              height: proxy.size.height * 0.9 + CGFloat(index) * 22
            )
            .rotationEffect(.degrees(-32)).offset(
              x: proxy.size.width * 0.4, y: proxy.size.height * 0.15)
        }
      }
    }.clipped()
  }
}
