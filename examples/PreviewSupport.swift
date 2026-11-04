import SwiftUI

#if SWIFT_PACKAGE
  import HugsyPreviewKit
#endif

#if os(iOS)
  import UIKit
#endif

struct PreviewStory: Identifiable {
  let id: String
  let title: String
  let subtitle: String
  let colors: [Color]
}

enum PreviewContent {
  static let still = PreviewStory(
    id: "still", title: "A slower\nkind of Sunday.", subtitle: "THE ART OF DOING LESS",
    colors: [Color(red: 0.89, green: 0.77, blue: 0.63), Color(red: 0.70, green: 0.62, blue: 0.51)])
  static let after = PreviewStory(
    id: "after", title: "After the\nlast light.", subtitle: "NOTES FROM THE CITY",
    colors: [Color(red: 0.42, green: 0.36, blue: 0.56), Color(red: 0.25, green: 0.22, blue: 0.38)])
  static let stories = [still, after]
}

struct PreviewScaffold<Content: View>: View {
  let session: PreviewSession
  let content: Content

  init(session: PreviewSession, @ViewBuilder content: () -> Content) {
    self.session = session
    self.content = content()
  }

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
          Text(session.definition.headline).font(.system(size: 38, weight: .medium))
            .tracking(-1.7).lineSpacing(-2)
        }
        content
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
  }
}

struct PreviewArtwork: View {
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
            ).rotationEffect(.degrees(-32)).offset(
              x: proxy.size.width * 0.4, y: proxy.size.height * 0.15)
        }
      }
    }.clipped()
  }
}

#if os(iOS)
  struct PreviewScrollDriver: UIViewRepresentable {
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
