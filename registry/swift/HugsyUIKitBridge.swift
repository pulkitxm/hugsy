#if canImport(UIKit)
  import SwiftUI
  import UIKit

  public struct HugsyUIViewBox: UIViewRepresentable {
    public let view: UIView

    public init(_ view: UIView) {
      self.view = view
    }

    public func makeUIView(context: Context) -> UIView { view }

    public func updateUIView(_ uiView: UIView, context: Context) {}
  }

  @MainActor final class HugsyUIViewCache {
    private var views: [AnyHashable: UIView] = [:]

    func view(for key: AnyHashable, make: () -> UIView) -> UIView {
      if let existing = views[key] { return existing }
      let created = make()
      views[key] = created
      return created
    }

    func retain(_ keys: Set<AnyHashable>) {
      views = views.filter { keys.contains($0.key) }
    }
  }

  extension UIViewController {
    func hugsyEmbed<Root: View>(_ root: Root) {
      let host = UIHostingController(rootView: root)
      host.view.backgroundColor = .clear
      host.view.translatesAutoresizingMaskIntoConstraints = false
      addChild(host)
      view.addSubview(host.view)
      NSLayoutConstraint.activate([
        host.view.leadingAnchor.constraint(equalTo: view.leadingAnchor),
        host.view.trailingAnchor.constraint(equalTo: view.trailingAnchor),
        host.view.topAnchor.constraint(equalTo: view.topAnchor),
        host.view.bottomAnchor.constraint(equalTo: view.bottomAnchor),
      ])
      host.didMove(toParent: self)
    }
  }
#endif
